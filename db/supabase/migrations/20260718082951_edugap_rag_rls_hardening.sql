ALTER TABLE app.course_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_materials_write_policy ON app.course_materials;
CREATE POLICY course_materials_write_policy ON app.course_materials
    FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON app.course_materials FROM PUBLIC, anon, authenticated;
GRANT ALL ON app.course_materials TO service_role;
