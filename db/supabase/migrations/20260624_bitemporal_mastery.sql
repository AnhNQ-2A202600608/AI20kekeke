-- ============================================================================
-- C2-App-125 | Bitemporal Graph Memory Schema Migration
-- Target: Supabase PostgreSQL 17
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- 1. Enable btree_gist extension (required for exclusion constraint with UUIDs)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Create bitemporal table
CREATE TABLE IF NOT EXISTS app.student_mastery_bitemporal (
    id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id             uuid        NOT NULL REFERENCES app.users(id)    ON DELETE CASCADE,
    course_id              uuid        NOT NULL REFERENCES app.courses(id)  ON DELETE CASCADE,
    concept_id             uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    elo_score              numeric(8,2) NOT NULL DEFAULT 1200.00,
    bkt_mastery_probability numeric(5,4) NOT NULL DEFAULT 0.2500,
    mastery_state          app.mastery_state NOT NULL DEFAULT 'not_started',
    weakness_flag          boolean     NOT NULL DEFAULT false,
    attempt_count          integer     NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    correct_count          integer     NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    last_practiced_at      timestamptz,
    stability_days         decimal     NOT NULL DEFAULT 3.0,
    valid_time             tstzrange   NOT NULL,
    transaction_time       tstzrange   NOT NULL DEFAULT tstzrange(now(), NULL),
    CONSTRAINT no_overlapping_mastery EXCLUDE USING gist (
        student_id WITH =,
        course_id WITH =,
        concept_id WITH =,
        valid_time WITH &&,
        transaction_time WITH &&
    ),
    CHECK (correct_count <= attempt_count),
    CHECK (bkt_mastery_probability BETWEEN 0 AND 1)
);

-- 3. Create active current state View (drop-in replacement for standard queries)
CREATE OR REPLACE VIEW app.active_student_mastery AS
SELECT
    id,
    student_id,
    course_id,
    concept_id,
    elo_score,
    bkt_mastery_probability,
    mastery_state,
    weakness_flag,
    attempt_count,
    correct_count,
    last_practiced_at,
    stability_days,
    valid_time,
    transaction_time
FROM app.student_mastery_bitemporal
WHERE transaction_time @> now()
  AND valid_time @> now();

-- 4. Create trigger function to manage transaction and valid time interval closing on direct inserts
CREATE OR REPLACE FUNCTION app.fn_student_mastery_bitemporal_insert()
RETURNS TRIGGER AS $$
DECLARE
    old_row record;
    now_time timestamptz := now();
    new_valid_start timestamptz;
BEGIN
    -- Check if trigger is bypassed
    IF current_setting('app.bypass_bitemporal_trigger', true) = 'true' THEN
        RETURN NEW;
    END IF;

    -- ONLY auto-close for standard inserts (open-ended valid time)
    IF upper(NEW.valid_time) IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Set default transaction time if not provided
    IF NEW.transaction_time IS NULL THEN
        NEW.transaction_time := tstzrange(now_time, NULL);
    END IF;

    new_valid_start := lower(NEW.valid_time);

    -- Find the old active row in both transaction time and valid time
    -- Lock it using SELECT FOR UPDATE to prevent concurrency race conditions
    SELECT * INTO old_row
    FROM app.student_mastery_bitemporal
    WHERE student_id = NEW.student_id
      AND course_id = NEW.course_id
      AND concept_id = NEW.concept_id
      AND transaction_time @> now_time
      AND valid_time @> new_valid_start
    FOR UPDATE;

    IF old_row.id IS NOT NULL THEN
        -- Close the old row's transaction time
        UPDATE app.student_mastery_bitemporal
        SET transaction_time = tstzrange(lower(transaction_time), now_time)
        WHERE id = old_row.id;

        -- If old row started before the new one, insert closed slice
        IF lower(old_row.valid_time) < new_valid_start THEN
            INSERT INTO app.student_mastery_bitemporal (
                student_id, course_id, concept_id, elo_score, bkt_mastery_probability,
                mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at,
                stability_days, valid_time, transaction_time
            ) VALUES (
                old_row.student_id, old_row.course_id, old_row.concept_id, old_row.elo_score, old_row.bkt_mastery_probability,
                old_row.mastery_state, old_row.weakness_flag, old_row.attempt_count, old_row.correct_count, old_row.last_practiced_at,
                old_row.stability_days, tstzrange(lower(old_row.valid_time), new_valid_start), tstzrange(now_time, NULL)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind trigger to bitemporal table
DROP TRIGGER IF EXISTS trg_student_mastery_bitemporal_insert ON app.student_mastery_bitemporal;
CREATE TRIGGER trg_student_mastery_bitemporal_insert
    BEFORE INSERT ON app.student_mastery_bitemporal
    FOR EACH ROW
    EXECUTE FUNCTION app.fn_student_mastery_bitemporal_insert();

-- 5. Create sync trigger to automatically log standard changes from legacy table to bitemporal table
CREATE OR REPLACE FUNCTION app.fn_sync_concept_mastery_to_bitemporal()
RETURNS TRIGGER AS $$
DECLARE
    now_time timestamptz := now();
BEGIN
    -- Check if trigger is bypassed
    IF current_setting('app.bypass_bitemporal_trigger', true) = 'true' THEN
        RETURN NEW;
    END IF;

    INSERT INTO app.student_mastery_bitemporal (
        student_id, course_id, concept_id, elo_score, bkt_mastery_probability,
        mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at,
        stability_days, valid_time, transaction_time
    ) VALUES (
        NEW.student_id, NEW.course_id, NEW.concept_id, NEW.elo_score, NEW.bkt_mastery_probability,
        NEW.mastery_state, NEW.weakness_flag, NEW.attempt_count, NEW.correct_count, NEW.last_practiced_at,
        NEW.stability_days, tstzrange(now_time, NULL), tstzrange(now_time, NULL)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind sync trigger to legacy table
DROP TRIGGER IF EXISTS trg_sync_concept_mastery_to_bitemporal ON app.student_concept_mastery;
CREATE TRIGGER trg_sync_concept_mastery_to_bitemporal
    AFTER INSERT OR UPDATE ON app.student_concept_mastery
    FOR EACH ROW
    EXECUTE FUNCTION app.fn_sync_concept_mastery_to_bitemporal();

-- 6. Create stored procedure to handle retroactive updates (splits)
CREATE OR REPLACE FUNCTION app.patch_student_mastery_retroactive(
    p_student_id             uuid,
    p_course_id              uuid,
    p_concept_id             uuid,
    p_elo_score              numeric(8,2),
    p_bkt_mastery_probability numeric(5,4),
    p_mastery_state          app.mastery_state,
    p_weakness_flag          boolean,
    p_attempt_count          integer,
    p_correct_count          integer,
    p_last_practiced_at      timestamptz,
    p_stability_days         numeric,
    p_patch_valid_time       tstzrange
)
RETURNS void AS $$
DECLARE
    now_time timestamptz := now();
    r record;
    left_range tstzrange;
    right_range tstzrange;
BEGIN
    -- Bypass triggers during retroactive patching to prevent cycles / duplication
    PERFORM set_config('app.bypass_bitemporal_trigger', 'true', true);

    -- 1. Lock all overlapping active rows to prevent concurrent modifications
    FOR r IN 
        SELECT * 
        FROM app.student_mastery_bitemporal
        WHERE student_id = p_student_id
          AND course_id = p_course_id
          AND concept_id = p_concept_id
          AND transaction_time @> now_time
          AND valid_time && p_patch_valid_time
        FOR UPDATE
    LOOP
        -- 2. Close the old row's transaction time
        UPDATE app.student_mastery_bitemporal
        SET transaction_time = tstzrange(lower(transaction_time), now_time)
        WHERE id = r.id;

        -- 3. Calculate left non-overlapping range
        IF lower(r.valid_time) < lower(p_patch_valid_time) THEN
            left_range := tstzrange(lower(r.valid_time), lower(p_patch_valid_time));
            INSERT INTO app.student_mastery_bitemporal (
                student_id, course_id, concept_id, elo_score, bkt_mastery_probability,
                mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at,
                stability_days, valid_time, transaction_time
            ) VALUES (
                r.student_id, r.course_id, r.concept_id, r.elo_score, r.bkt_mastery_probability,
                r.mastery_state, r.weakness_flag, r.attempt_count, r.correct_count, r.last_practiced_at,
                r.stability_days, left_range, tstzrange(now_time, NULL)
            );
        END IF;

        -- 4. Calculate right non-overlapping range
        IF upper(r.valid_time) IS NULL OR upper(r.valid_time) > upper(p_patch_valid_time) THEN
            right_range := tstzrange(upper(p_patch_valid_time), upper(r.valid_time));
            INSERT INTO app.student_mastery_bitemporal (
                student_id, course_id, concept_id, elo_score, bkt_mastery_probability,
                mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at,
                stability_days, valid_time, transaction_time
            ) VALUES (
                r.student_id, r.course_id, r.concept_id, r.elo_score, r.bkt_mastery_probability,
                r.mastery_state, r.weakness_flag, r.attempt_count, r.correct_count, r.last_practiced_at,
                r.stability_days, right_range, tstzrange(now_time, NULL)
            );
        END IF;
    END LOOP;

    -- 5. Insert the new patched range
    INSERT INTO app.student_mastery_bitemporal (
        student_id, course_id, concept_id, elo_score, bkt_mastery_probability,
        mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at,
        stability_days, valid_time, transaction_time
    ) VALUES (
        p_student_id, p_course_id, p_concept_id, p_elo_score, p_bkt_mastery_probability,
        p_mastery_state, p_weakness_flag, p_attempt_count, p_correct_count, p_last_practiced_at,
        p_stability_days, p_patch_valid_time, tstzrange(now_time, NULL)
    );

    -- 6. If the patched valid time covers the current time, update the legacy table as well
    IF p_patch_valid_time @> now_time THEN
        UPDATE app.student_concept_mastery
        SET elo_score = p_elo_score,
            bkt_mastery_probability = p_bkt_mastery_probability,
            mastery_state = p_mastery_state,
            weakness_flag = p_weakness_flag,
            attempt_count = p_attempt_count,
            correct_count = p_correct_count,
            last_practiced_at = p_last_practiced_at,
            stability_days = p_stability_days,
            updated_at = now_time
        WHERE student_id = p_student_id
          AND course_id = p_course_id
          AND concept_id = p_concept_id;
    END IF;

    -- Re-enable triggers
    PERFORM set_config('app.bypass_bitemporal_trigger', 'false', true);
END;
$$ LANGUAGE plpgsql;

COMMIT;
