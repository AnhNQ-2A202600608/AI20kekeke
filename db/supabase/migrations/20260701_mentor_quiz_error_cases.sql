-- ============================================================================
-- C2-App-125 | Mentor Quiz Error Cases
-- Target: Supabase PostgreSQL
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- Mentor-facing workflow for student quiz error reports.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'app'
          AND t.typname = 'quiz_error_case_status'
    ) THEN
        CREATE TYPE app.quiz_error_case_status AS ENUM (
            'new',
            'in_progress',
            'resolved',
            'rejected'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS app.quiz_error_cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES app.questions(id) ON DELETE CASCADE,
    status app.quiz_error_case_status NOT NULL DEFAULT 'new',
    report_count integer NOT NULL DEFAULT 0 CHECK (report_count >= 0),
    last_reported_at timestamptz NOT NULL DEFAULT now(),
    assigned_to uuid REFERENCES app.users(id) ON DELETE SET NULL,
    resolved_by uuid REFERENCES app.users(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    resolution_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.quiz_error_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES app.quiz_error_cases(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES app.questions(id) ON DELETE CASCADE,
    selected_option text,
    error_type text NOT NULL,
    detail text NOT NULL,
    question_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_error_cases_course_status
    ON app.quiz_error_cases (course_id, status, last_reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_error_cases_question_status
    ON app.quiz_error_cases (question_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_error_cases_open_unique
    ON app.quiz_error_cases (course_id, question_id)
    WHERE status IN ('new', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_quiz_error_reports_case_created
    ON app.quiz_error_reports (case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_error_reports_student_created
    ON app.quiz_error_reports (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_error_reports_course_question_created
    ON app.quiz_error_reports (course_id, question_id, created_at DESC);

ALTER TABLE app.quiz_error_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.quiz_error_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON app.quiz_error_cases TO authenticated;
GRANT SELECT ON app.quiz_error_reports TO authenticated;
GRANT ALL ON app.quiz_error_cases TO service_role;
GRANT ALL ON app.quiz_error_reports TO service_role;

DROP POLICY IF EXISTS quiz_error_cases_service_role_all ON app.quiz_error_cases;
CREATE POLICY quiz_error_cases_service_role_all
    ON app.quiz_error_cases
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS quiz_error_reports_service_role_all ON app.quiz_error_reports;
CREATE POLICY quiz_error_reports_service_role_all
    ON app.quiz_error_reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS quiz_error_cases_mentor_select ON app.quiz_error_cases;
CREATE POLICY quiz_error_cases_mentor_select
    ON app.quiz_error_cases
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM app.user_roles ur
            JOIN app.roles r ON r.id = ur.role_id
            WHERE ur.user_id = (SELECT auth.uid())
              AND r.code IN ('mentor', 'admin', 'dev')
        )
    );

DROP POLICY IF EXISTS quiz_error_cases_mentor_update ON app.quiz_error_cases;

DROP POLICY IF EXISTS quiz_error_reports_student_insert ON app.quiz_error_reports;

DROP POLICY IF EXISTS quiz_error_reports_mentor_select ON app.quiz_error_reports;
CREATE POLICY quiz_error_reports_mentor_select
    ON app.quiz_error_reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM app.user_roles ur
            JOIN app.roles r ON r.id = ur.role_id
            WHERE ur.user_id = (SELECT auth.uid())
              AND r.code IN ('mentor', 'admin', 'dev')
        )
    );

COMMIT;
