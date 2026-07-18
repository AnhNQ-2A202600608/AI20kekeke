-- ============================================================================
-- C2-App-125 | Onboarding diagnostic question-bank sessions
-- Target: Supabase PostgreSQL
-- Re-run safe: YES
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app.onboarding_diagnostic_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    survey jsonb NOT NULL DEFAULT '{}'::jsonb,
    candidate_question_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
    candidate_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
    answered jsonb NOT NULL DEFAULT '[]'::jsonb,
    current_question_id uuid REFERENCES app.questions(id) ON DELETE SET NULL,
    expires_at timestamptz NOT NULL,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_diagnostic_sessions_student
    ON app.onboarding_diagnostic_sessions (student_id, completed_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_questions_course_status_difficulty
    ON app.questions (course_id, calibration_status, type, difficulty_elo);

ALTER TABLE app.onboarding_diagnostic_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON app.onboarding_diagnostic_sessions FROM anon;
REVOKE ALL ON app.onboarding_diagnostic_sessions FROM authenticated;
GRANT ALL ON app.onboarding_diagnostic_sessions TO service_role;

DROP POLICY IF EXISTS onboarding_diagnostic_sessions_service_role
    ON app.onboarding_diagnostic_sessions;
CREATE POLICY onboarding_diagnostic_sessions_service_role
    ON app.onboarding_diagnostic_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;
