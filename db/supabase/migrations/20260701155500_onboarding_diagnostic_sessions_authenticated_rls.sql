-- ============================================================================
-- C2-App-125 | Onboarding diagnostic session authenticated access
-- Target: Supabase PostgreSQL
-- Re-run safe: YES
-- ============================================================================

BEGIN;

GRANT SELECT, INSERT, UPDATE ON app.onboarding_diagnostic_sessions TO authenticated;

DROP POLICY IF EXISTS onboarding_diagnostic_sessions_authenticated_select
    ON app.onboarding_diagnostic_sessions;
CREATE POLICY onboarding_diagnostic_sessions_authenticated_select
    ON app.onboarding_diagnostic_sessions
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = student_id);

DROP POLICY IF EXISTS onboarding_diagnostic_sessions_authenticated_insert
    ON app.onboarding_diagnostic_sessions;
CREATE POLICY onboarding_diagnostic_sessions_authenticated_insert
    ON app.onboarding_diagnostic_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = student_id);

DROP POLICY IF EXISTS onboarding_diagnostic_sessions_authenticated_update
    ON app.onboarding_diagnostic_sessions;
CREATE POLICY onboarding_diagnostic_sessions_authenticated_update
    ON app.onboarding_diagnostic_sessions
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = student_id)
    WITH CHECK ((SELECT auth.uid()) = student_id);

COMMIT;
