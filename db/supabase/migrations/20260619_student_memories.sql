-- ============================================================================
-- ai20kekeke | Student Memories Table for Long-Term Facts
-- Target: Supabase PostgreSQL 17
-- Re-run safe: YES
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS app.student_memories (
    student_id  uuid        PRIMARY KEY REFERENCES app.users(id) ON DELETE CASCADE,
    facts       jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Grant select, insert, update, delete permissions on the new table to authenticated/anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON app.student_memories TO anon, authenticated;

COMMIT;
