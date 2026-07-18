-- ============================================================================
-- C2-App-125 | Dev Accounts & MSSV Login Support
-- Target: Supabase PostgreSQL 17 (mentora-dev)
-- Date: 2026-06-16
-- Re-run safe: YES — all statements use IF NOT EXISTS / ON CONFLICT
-- ============================================================================

-- 1. Enum value addition for 'dev' role (executed outside transaction)
ALTER TYPE app.course_role ADD VALUE IF NOT EXISTS 'dev';

-- 2. DDL and Seeding
BEGIN;

-- Insert dev role metadata
INSERT INTO app.roles (code, name) 
VALUES ('dev', 'Developer') 
ON CONFLICT (code) DO NOTHING;

-- Add mssv column to users
ALTER TABLE app.users 
    ADD COLUMN IF NOT EXISTS mssv text UNIQUE;

-- Enable Row Level Security (RLS) on user & role tables
ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.roles ENABLE ROW LEVEL SECURITY;

-- Create SELECT policies to allow login queries from clients using anon key
DROP POLICY IF EXISTS "Allow select for login" ON app.users;
CREATE POLICY "Allow select for login" ON app.users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow select for login" ON app.user_roles;
CREATE POLICY "Allow select for login" ON app.user_roles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow select for login" ON app.roles;
CREATE POLICY "Allow select for login" ON app.roles FOR SELECT TO anon, authenticated USING (true);

-- Create INSERT policies to allow registration/signup from clients using anon key
DROP POLICY IF EXISTS "Allow insert for signup" ON app.users;
CREATE POLICY "Allow insert for signup" ON app.users FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert for signup" ON app.user_roles;
CREATE POLICY "Allow insert for signup" ON app.user_roles FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Grant USAGE on custom schemas to Supabase roles
GRANT USAGE ON SCHEMA app TO anon, authenticated;
GRANT USAGE ON SCHEMA audit TO anon, authenticated;

-- Grant access to tables and sequences in schemas
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO anon, authenticated;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO anon, authenticated;



-- Seed default student user d3b07384-d113-4ec5-a58e-0f2d87e07661
INSERT INTO app.users (id, email, full_name, status, mssv) 
VALUES ('d3b07384-d113-4ec5-a58e-0f2d87e07661', 'student@mentora.vn', 'Nguyễn Văn Thực Chiến', 'active', '2A202611111') 
ON CONFLICT (id) DO UPDATE SET mssv = EXCLUDED.mssv;

INSERT INTO app.course_members (course_id, user_id, role_code, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'd3b07384-d113-4ec5-a58e-0f2d87e07661', 'student', 'active') 
ON CONFLICT (course_id, user_id, role_code) DO NOTHING;

-- Seed developer accounts
INSERT INTO app.users (id, email, full_name, status, mssv) VALUES
('11111111-1111-1111-1111-111111111111', 'dev1@mentora.vn', 'Developer One', 'active', '2A202600001'),
('22222222-2222-2222-2222-222222222222', 'dev2@mentora.vn', 'Developer Two', 'active', '2A202600002'),
('33333333-3333-3333-3333-333333333333', 'dev3@mentora.vn', 'Developer Three', 'active', '2A202600003')
ON CONFLICT (id) DO UPDATE SET mssv = EXCLUDED.mssv, full_name = EXCLUDED.full_name;

-- Map dev users to dev role using dynamic query for role ID
INSERT INTO app.user_roles (user_id, role_id) 
SELECT '11111111-1111-1111-1111-111111111111', id FROM app.roles WHERE code = 'dev'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO app.user_roles (user_id, role_id) 
SELECT '22222222-2222-2222-2222-222222222222', id FROM app.roles WHERE code = 'dev'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO app.user_roles (user_id, role_id) 
SELECT '33333333-3333-3333-3333-333333333333', id FROM app.roles WHERE code = 'dev'
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;
