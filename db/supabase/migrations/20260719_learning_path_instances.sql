-- ============================================================================
-- ai20kekeke | Create app.learning_path_instances and RLS Policies
-- Target: Supabase PostgreSQL
-- Re-run safe: YES
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app.learning_path_instances (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    course_id     UUID NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    source        TEXT NOT NULL CHECK (source IN ('auto', 'mentor')),
    trigger_type  TEXT NOT NULL CHECK (trigger_type IN ('midterm', 'final', 'mentor_manual')),
    exam_attempt_id UUID REFERENCES app.exam_attempts(id) ON DELETE SET NULL,
    mentor_id     UUID REFERENCES app.users(id) ON DELETE SET NULL,
    path_data     JSONB NOT NULL,
    status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_path_instances_student_course 
    ON app.learning_path_instances (student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_learning_path_instances_exam_attempt 
    ON app.learning_path_instances (exam_attempt_id);

-- Enable RLS
ALTER TABLE app.learning_path_instances ENABLE ROW LEVEL SECURITY;

-- 1. Student SELECT own learning paths
DROP POLICY IF EXISTS student_read_own ON app.learning_path_instances;
CREATE POLICY student_read_own ON app.learning_path_instances
    FOR SELECT TO authenticated USING (student_id = auth.uid());

-- 2. Mentor SELECT student learning paths in their course
DROP POLICY IF EXISTS mentor_read_course_students ON app.learning_path_instances;
CREATE POLICY mentor_read_course_students ON app.learning_path_instances
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM app.course_members cm
            WHERE cm.course_id = learning_path_instances.course_id
              AND cm.user_id = auth.uid()
              AND cm.role_code = 'mentor'
        )
    );

-- 3. Mentor INSERT learning paths for students in their course
DROP POLICY IF EXISTS mentor_write_course_students ON app.learning_path_instances;
CREATE POLICY mentor_write_course_students ON app.learning_path_instances
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM app.course_members cm
            WHERE cm.course_id = learning_path_instances.course_id
              AND cm.user_id = auth.uid()
              AND cm.role_code = 'mentor'
        )
    );

-- 4. Service role bypass RLS
DROP POLICY IF EXISTS service_role_all ON app.learning_path_instances;
CREATE POLICY service_role_all ON app.learning_path_instances
    FOR ALL TO service_role USING (true);

COMMIT;
