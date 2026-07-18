-- ============================================================================
-- C2-App-125 | Enable anonymous access to feedback_events
-- Target: Supabase PostgreSQL 17
-- Re-run safe: YES
-- ============================================================================

DROP POLICY IF EXISTS "Allow anonymous feedback insert" ON app.feedback_events;
CREATE POLICY "Allow anonymous feedback insert" ON app.feedback_events 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous feedback select" ON app.feedback_events;
CREATE POLICY "Allow anonymous feedback select" ON app.feedback_events 
  FOR SELECT 
  TO anon 
  USING (created_at >= now() - interval '10 seconds');

