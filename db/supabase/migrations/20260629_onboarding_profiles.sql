-- ============================================================================
-- C2-App-125 | Student Onboarding Profiles
-- Target: Supabase PostgreSQL
-- Re-run safe: YES
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app.onboarding_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    profile_version TEXT NOT NULL DEFAULT 'onboarding_v1',
    survey JSONB NOT NULL DEFAULT '{}'::jsonb,
    diagnostic_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommended_concept_id TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT onboarding_profiles_student_version_unique UNIQUE (student_id, profile_version)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_student
    ON app.onboarding_profiles (student_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_completed
    ON app.onboarding_profiles (student_id, profile_version, completed_at);

ALTER TABLE app.onboarding_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON app.onboarding_profiles TO authenticated;
GRANT ALL ON app.onboarding_profiles TO service_role;

DROP POLICY IF EXISTS onboarding_profiles_select_own ON app.onboarding_profiles;
CREATE POLICY onboarding_profiles_select_own
    ON app.onboarding_profiles
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = student_id);

DROP POLICY IF EXISTS onboarding_profiles_insert_own ON app.onboarding_profiles;
CREATE POLICY onboarding_profiles_insert_own
    ON app.onboarding_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = student_id);

DROP POLICY IF EXISTS onboarding_profiles_update_own ON app.onboarding_profiles;
CREATE POLICY onboarding_profiles_update_own
    ON app.onboarding_profiles
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = student_id)
    WITH CHECK ((SELECT auth.uid()) = student_id);

DROP POLICY IF EXISTS onboarding_profiles_service_role ON app.onboarding_profiles;
CREATE POLICY onboarding_profiles_service_role
    ON app.onboarding_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;

