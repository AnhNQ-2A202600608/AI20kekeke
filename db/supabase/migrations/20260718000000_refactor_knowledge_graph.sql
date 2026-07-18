-- ============================================================================
-- C2-App-125 | Refactor Knowledge Graph Pipeline (Grade 6 Refactoring)
-- Target: Supabase PostgreSQL 17
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- 1. Course Code Migration (math-k1-9 -> math-k6 and hist-geo-k6-9 -> hist-geo-k6)
DO $$
DECLARE
    old_math_id uuid;
    new_math_id uuid;
    old_hg_id uuid;
    new_hg_id uuid;
    t record;
BEGIN
    -- Math Course Migration
    SELECT id INTO old_math_id FROM app.courses WHERE code = 'math-k1-9';
    SELECT id INTO new_math_id FROM app.courses WHERE code = 'math-k6';

    IF old_math_id IS NOT NULL THEN
        IF new_math_id IS NULL THEN
            UPDATE app.courses SET code = 'math-k6' WHERE id = old_math_id;
            new_math_id := old_math_id;
        ELSE
            -- Both exist, merge them
            FOR t IN 
                SELECT table_schema, table_name, column_name 
                FROM information_schema.columns 
                WHERE column_name = 'course_id' AND table_schema IN ('app', 'audit')
            LOOP
                -- Skip updating courses itself
                IF t.table_name <> 'courses' THEN
                    EXECUTE format('UPDATE %I.%I SET course_id = %L WHERE course_id = %L', 
                                   t.table_schema, t.table_name, new_math_id, old_math_id);
                END IF;
            END LOOP;
            DELETE FROM app.courses WHERE id = old_math_id;
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM app.courses WHERE code = 'math-k6') THEN
            INSERT INTO app.courses (code, title, status) VALUES ('math-k6', 'Toán lớp 6', 'active') RETURNING id INTO new_math_id;
        ELSE
            SELECT id INTO new_math_id FROM app.courses WHERE code = 'math-k6';
        END IF;
    END IF;

    -- History & Geography Course Migration
    SELECT id INTO old_hg_id FROM app.courses WHERE code = 'hist-geo-k6-9';
    SELECT id INTO new_hg_id FROM app.courses WHERE code = 'hist-geo-k6';

    IF old_hg_id IS NOT NULL THEN
        IF new_hg_id IS NULL THEN
            UPDATE app.courses SET code = 'hist-geo-k6' WHERE id = old_hg_id;
            new_hg_id := old_hg_id;
        ELSE
            -- Both exist, merge them
            FOR t IN 
                SELECT table_schema, table_name, column_name 
                FROM information_schema.columns 
                WHERE column_name = 'course_id' AND table_schema IN ('app', 'audit')
            LOOP
                IF t.table_name <> 'courses' THEN
                    EXECUTE format('UPDATE %I.%I SET course_id = %L WHERE course_id = %L', 
                                   t.table_schema, t.table_name, new_hg_id, old_hg_id);
                END IF;
            END LOOP;
            DELETE FROM app.courses WHERE id = old_hg_id;
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM app.courses WHERE code = 'hist-geo-k6') THEN
            INSERT INTO app.courses (code, title, status) VALUES ('hist-geo-k6', 'Lịch sử và Địa lí lớp 6', 'active') RETURNING id INTO new_hg_id;
        ELSE
            SELECT id INTO new_hg_id FROM app.courses WHERE code = 'hist-geo-k6';
        END IF;
    END IF;
END $$;

-- 2. Create app.extraction_runs Table
CREATE TABLE IF NOT EXISTS app.extraction_runs (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    subject           text        NOT NULL,
    grade             integer     NOT NULL,
    pipeline_version  text        NOT NULL,
    graph_version     text        NOT NULL,
    prompt_version    text        NOT NULL,
    model_provider    text        NOT NULL,
    model_name        text        NOT NULL,
    started_at        timestamptz NOT NULL DEFAULT now(),
    completed_at      timestamptz,
    status            text        NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
    input_manifest    jsonb,
    config            jsonb,
    statistics        jsonb,
    error_summary     text,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- 3. Create app.documents Table
CREATE TABLE IF NOT EXISTS app.documents (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    document_code     text        NOT NULL,
    title             text        NOT NULL,
    subject           text        NOT NULL,
    grade             integer     NOT NULL,
    source_type       text        NOT NULL, -- 'SGK', 'SGV'
    storage_path      text,
    checksum          text        NOT NULL,
    metadata          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (course_id, document_code, checksum)
);

-- 4. Create app.document_chunks Table
CREATE TABLE IF NOT EXISTS app.document_chunks (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id       uuid        NOT NULL REFERENCES app.documents(id) ON DELETE CASCADE,
    external_chunk_id text        NOT NULL,
    chunk_index       integer     NOT NULL,
    content           text        NOT NULL,
    content_hash      text        NOT NULL,
    page_start        integer,
    page_end          integer,
    chapter_title     text,
    lesson_title      text,
    section_title     text,
    metadata          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (document_id, external_chunk_id)
);

-- 5. Add columns to app.concepts
ALTER TABLE app.concepts
    ADD COLUMN IF NOT EXISTS canonical_code text,
    ADD COLUMN IF NOT EXISTS normalized_name text,
    ADD COLUMN IF NOT EXISTS aliases text[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS concept_type text,
    ADD COLUMN IF NOT EXISTS graph_version text,
    ADD COLUMN IF NOT EXISTS prompt_version text,
    ADD COLUMN IF NOT EXISTS extraction_run_id uuid REFERENCES app.extraction_runs(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_concept_type' AND conrelid = 'app.concepts'::regclass) THEN
        ALTER TABLE app.concepts ADD CONSTRAINT chk_concept_type CHECK (concept_type IN ('knowledge', 'skill', 'subskill', 'misconception'));
    END IF;
END $$;

-- 6. Add columns to app.concept_relations and refactor relation_type
ALTER TABLE app.concept_relations
    ALTER COLUMN relation_type TYPE text,
    ADD COLUMN IF NOT EXISTS confidence numeric DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS validation_errors jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS graph_version text,
    ADD COLUMN IF NOT EXISTS prompt_version text,
    ADD COLUMN IF NOT EXISTS extraction_run_id uuid REFERENCES app.extraction_runs(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved_by text,
    ADD COLUMN IF NOT EXISTS approved_at timestamptz,
    ADD COLUMN IF NOT EXISTS approval_method text;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_relation_type' AND conrelid = 'app.concept_relations'::regclass) THEN
        ALTER TABLE app.concept_relations ADD CONSTRAINT chk_relation_type CHECK (relation_type IN (
            'prerequisite_of', 'causes', 'part_of', 'is_a', 'used_for', 'compared_with', 'related_to', 'has_misconception', 'addresses_misconception',
            -- Legacy support
            'Prerequisite_of', 'Used_for', 'Compare', 'Conjunction', 'Hyponym_of', 'Evaluate_for', 'Part_of'
        ));
    END IF;
END $$;

-- 7. Create app.concept_sources Table
CREATE TABLE IF NOT EXISTS app.concept_sources (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id        uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    document_id       uuid        NOT NULL REFERENCES app.documents(id) ON DELETE CASCADE,
    chunk_id          uuid        NOT NULL REFERENCES app.document_chunks(id) ON DELETE CASCADE,
    source_role       text        NOT NULL, -- 'definition', 'explanation', 'example', 'exercise', 'learning_objective', 'misconception', 'relation_evidence'
    evidence          text,
    page_start        integer,
    page_end          integer,
    confidence        numeric     NOT NULL DEFAULT 1.0,
    extraction_run_id uuid        REFERENCES app.extraction_runs(id) ON DELETE SET NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (concept_id, chunk_id, source_role)
);

-- 8. Create app.relation_sources Table
CREATE TABLE IF NOT EXISTS app.relation_sources (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    relation_id       uuid        NOT NULL REFERENCES app.concept_relations(id) ON DELETE CASCADE,
    document_id       uuid        NOT NULL REFERENCES app.documents(id) ON DELETE CASCADE,
    chunk_id          uuid        NOT NULL REFERENCES app.document_chunks(id) ON DELETE CASCADE,
    evidence          text,
    evidence_hash     text        NOT NULL,
    page_start        integer,
    page_end          integer,
    confidence        numeric     NOT NULL DEFAULT 1.0,
    extraction_run_id uuid        REFERENCES app.extraction_runs(id) ON DELETE SET NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (relation_id, chunk_id, evidence_hash)
);

-- 9. Create indexes for optimization
CREATE INDEX IF NOT EXISTS idx_extraction_runs_course ON app.extraction_runs (course_id);
CREATE INDEX IF NOT EXISTS idx_documents_course ON app.documents (course_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON app.document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_concept_sources_concept ON app.concept_sources (concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_sources_chunk ON app.concept_sources (chunk_id);
CREATE INDEX IF NOT EXISTS idx_relation_sources_relation ON app.relation_sources (relation_id);
CREATE INDEX IF NOT EXISTS idx_relation_sources_chunk ON app.relation_sources (chunk_id);

COMMIT;
