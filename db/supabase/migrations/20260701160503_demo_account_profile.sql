-- ============================================================================
-- C2-App-125 | Demo-only account profile flags
-- Target: Supabase PostgreSQL
-- Re-run safe: YES
-- ============================================================================

BEGIN;

ALTER TABLE app.users
    ADD COLUMN IF NOT EXISTS is_demo_account boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS demo_profile_key text;

COMMENT ON COLUMN app.users.is_demo_account IS
    'Server-side flag for accounts that should run deterministic demo-only product flows.';

COMMENT ON COLUMN app.users.demo_profile_key IS
    'Named demo profile used by the app/backend to seed and lock deterministic demo states.';

CREATE INDEX IF NOT EXISTS idx_users_demo_profile_key
    ON app.users (demo_profile_key)
    WHERE is_demo_account = true;

UPDATE app.users
   SET is_demo_account = true,
       demo_profile_key = 'full_flow_v1'
 WHERE lower(email) IN ('specify@mentora.vn', 'demo.flow@mentora.vn');

COMMIT;
