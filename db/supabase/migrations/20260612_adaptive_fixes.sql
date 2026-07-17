-- ============================================================================
-- C2-App-125 | Adaptive Engine — Blocker Fixes Migration
-- Target: Supabase PostgreSQL 17 (edugap-dev)
-- Fixes: B1 B2 B3 B5 B6 B7 H1
-- Date: 2026-06-12
-- Re-run safe: YES — all statements use IF NOT EXISTS / OR REPLACE
-- ============================================================================
-- Đối chiếu:
--   Report    → plans/reports/BAO_CAO_THAM_DINH_ADAPTIVE.md
--   ADR-004   → ADR/adr-004-question-elo-concurrency-locking.md
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD COLUMNS TO EXISTING TABLES
-- ============================================================================

-- [B3] Replay attack protection: consumed_at on adaptive_decisions
ALTER TABLE audit.adaptive_decisions
    ADD COLUMN IF NOT EXISTS consumed_at timestamptz DEFAULT NULL;

-- [B6] Per-course bandit policy: add course_id to adaptive_policies
ALTER TABLE audit.adaptive_policies
    ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES app.courses(id) ON DELETE CASCADE DEFAULT NULL;

-- Index for per-course policy lookup
CREATE INDEX IF NOT EXISTS idx_adaptive_policies_course_name_status
    ON audit.adaptive_policies (course_id, name, status);

-- ============================================================================
-- 2. NEW TABLES
-- ============================================================================

-- [B6] Per-arm bandit state table (replaces monolithic JSON blob)
--      Each row = one question (arm) in one policy, updated in-place
CREATE TABLE IF NOT EXISTS audit.bandit_arms (
    policy_id   uuid  NOT NULL REFERENCES audit.adaptive_policies(id) ON DELETE CASCADE,
    arm_id      text  NOT NULL,                 -- question UUID as text
    a_inv       jsonb NOT NULL DEFAULT '[[1,0,0],[0,1,0],[0,0,1]]'::jsonb,  -- 3x3 identity
    b           jsonb NOT NULL DEFAULT '[0,0,0]'::jsonb,                     -- 3-dim zero vector
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (policy_id, arm_id)
);

CREATE INDEX IF NOT EXISTS idx_bandit_arms_policy
    ON audit.bandit_arms (policy_id);

-- [B4 / Q2] Hint log table — server-side hint count tracking
--            One row per hint request, grouped by (student, question, session)
CREATE TABLE IF NOT EXISTS app.hint_logs (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  uuid        NOT NULL REFERENCES app.users(id)     ON DELETE CASCADE,
    course_id   uuid        NOT NULL REFERENCES app.courses(id)   ON DELETE CASCADE,
    question_id uuid        NOT NULL REFERENCES app.questions(id) ON DELETE CASCADE,
    decision_id uuid        REFERENCES audit.adaptive_decisions(id) ON DELETE SET NULL,
    hint_level  integer     NOT NULL DEFAULT 1 CHECK (hint_level BETWEEN 1 AND 3),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hint_logs_student_question
    ON app.hint_logs (student_id, question_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hint_logs_decision
    ON app.hint_logs (decision_id);

-- ============================================================================
-- 3. RPC: submit_attempt_txn
--    Giải quyết B1 (atomic), B2 (FOR UPDATE), B3 (consumed_at), B5 (k_student/k_question)
--    Gọi từ Python: db.app_client.rpc("submit_attempt_txn", {...}).execute()
-- ============================================================================
CREATE OR REPLACE FUNCTION app.submit_attempt_txn(
    p_decision_id   uuid,
    p_student_id    uuid,
    p_course_id     uuid,
    p_concept_id    uuid,
    p_question_id   uuid,
    p_student_answer jsonb,
    p_actual_score  numeric,    -- đã được server chấm (B4)
    p_hint_count    int,        -- số hint dùng trong lượt này
    p_used_ai_help  boolean,
    p_k_student     numeric DEFAULT 32.0,
    p_k_question    numeric DEFAULT 32.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mastery   record;
    v_question  record;
    v_expected  numeric;
    v_sd        numeric;
    v_qd        numeric;
    v_disc      numeric;
    v_exponent  numeric;
    v_new_student_elo  numeric;
    v_new_question_elo numeric;
    v_is_correct       boolean;
BEGIN
    -- -------------------------------------------------------------------------
    -- (B3) Tiêu thụ decision một lần duy nhất — chặn Replay Attack
    -- -------------------------------------------------------------------------
    UPDATE audit.adaptive_decisions
       SET consumed_at = now()
     WHERE id          = p_decision_id
       AND student_id  = p_student_id
       AND selected_action_id = p_question_id
       AND consumed_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'DECISION_INVALID_OR_CONSUMED'
            USING ERRCODE = 'P0409', DETAIL = 'decision_id đã được tiêu thụ hoặc không hợp lệ';
    END IF;

    -- -------------------------------------------------------------------------
    -- (B2) Khóa bi quan đúng ADR-004 — SELECT FOR UPDATE
    -- -------------------------------------------------------------------------
    SELECT * INTO v_mastery
      FROM app.student_concept_mastery
     WHERE student_id = p_student_id
       AND course_id  = p_course_id
       AND concept_id = p_concept_id
     FOR UPDATE;

    SELECT * INTO v_question
      FROM app.questions
     WHERE id = p_question_id
     FOR UPDATE;

    -- -------------------------------------------------------------------------
    -- Tính Elo với clamp chống overflow (C1)
    -- -------------------------------------------------------------------------
    v_exponent := least(20.0, greatest(-20.0,
        (v_question.difficulty_elo - v_mastery.elo_score) / 400.0));
    v_expected := 1.0 / (1.0 + power(10.0, v_exponent));

    v_sd := p_actual_score - v_expected;
    v_qd := v_expected - p_actual_score;

    -- Hint discount: chỉ áp dụng khi làm đúng (sd > 0) có dùng hint
    IF v_sd > 0 AND p_hint_count > 0 THEN
        v_disc := greatest(0.1, 1.0 - 0.3 * p_hint_count);
        v_sd := v_sd * v_disc;
        v_qd := v_qd * v_disc;
    END IF;

    -- (B5) AI-help: đóng băng riêng student Elo, câu hỏi vẫn hiệu chuẩn
    IF p_used_ai_help THEN
        p_k_student := 0.0;
    END IF;

    v_new_student_elo  := round(v_mastery.elo_score       + p_k_student  * v_sd, 2);
    v_new_question_elo := round(v_question.difficulty_elo + p_k_question * v_qd, 2);
    v_is_correct       := (p_actual_score >= 0.75);

    -- -------------------------------------------------------------------------
    -- (B2) Cập nhật atomic — dùng incremental counter, không read-modify-write
    -- -------------------------------------------------------------------------
    UPDATE app.student_concept_mastery
       SET elo_score       = v_new_student_elo,
           attempt_count   = attempt_count + 1,
           correct_count   = correct_count + (CASE WHEN v_is_correct THEN 1 ELSE 0 END),
           last_practiced_at = now(),
           updated_at      = now()
     WHERE student_id = p_student_id
       AND course_id  = p_course_id
       AND concept_id = p_concept_id;

    UPDATE app.questions
       SET difficulty_elo = v_new_question_elo,
           updated_at     = now()
     WHERE id = p_question_id;

    -- Insert quiz attempt log
    INSERT INTO app.quiz_attempts (
        student_id, course_id, question_id, concept_id,
        adaptive_decision_id, student_answer,
        is_correct, actual_score, expected_success,
        hint_count, used_ai_help, grading_method
    ) VALUES (
        p_student_id, p_course_id, p_question_id, p_concept_id,
        p_decision_id, p_student_answer,
        v_is_correct, p_actual_score, v_expected,
        p_hint_count, p_used_ai_help, 'deterministic'
    );

    -- Return delta info (app-layer dùng để cập nhật BKT + bandit + event logs)
    RETURN jsonb_build_object(
        'old_student_elo',   v_mastery.elo_score,
        'new_student_elo',   v_new_student_elo,
        'old_question_elo',  v_question.difficulty_elo,
        'new_question_elo',  v_new_question_elo,
        'expected_success',  v_expected,
        'is_correct',        v_is_correct
    );
END;
$$;

-- Grant execute to authenticated role (Supabase default)
GRANT EXECUTE ON FUNCTION app.submit_attempt_txn TO authenticated;
GRANT EXECUTE ON FUNCTION app.submit_attempt_txn TO service_role;

-- ============================================================================
-- 4. HELPER: count hints server-side for a given decision
-- ============================================================================
CREATE OR REPLACE FUNCTION app.count_hints_for_decision(p_decision_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT COUNT(*)::integer
      FROM app.hint_logs
     WHERE decision_id = p_decision_id;
$$;

GRANT EXECUTE ON FUNCTION app.count_hints_for_decision TO authenticated;
GRANT EXECUTE ON FUNCTION app.count_hints_for_decision TO service_role;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema = 'audit' AND table_name = 'adaptive_decisions'
--    AND column_name = 'consumed_at';
--
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema = 'audit' AND table_name = 'adaptive_policies'
--    AND column_name = 'course_id';
--
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema IN ('app','audit')
--    AND table_name IN ('bandit_arms','hint_logs');
--
-- SELECT routine_name FROM information_schema.routines
--  WHERE routine_schema = 'app'
--    AND routine_name IN ('submit_attempt_txn','count_hints_for_decision');
