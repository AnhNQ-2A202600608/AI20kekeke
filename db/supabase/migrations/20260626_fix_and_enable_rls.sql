-- ============================================================================
-- C2-App-125 | Fix and Enable Row-Level Security Policies
-- Target: Supabase PostgreSQL 17 (edugap-dev / edugap)
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Enable Row Level Security (RLS) on all 32 tables
-- -------------------------------------------------------------------------

-- app schema
ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.course_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.material_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.student_concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.question_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.message_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.learning_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.hint_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.concept_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.student_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.calibration_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.question_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.student_mastery_bitemporal ENABLE ROW LEVEL SECURITY;

-- audit schema
ALTER TABLE audit.adaptive_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.adaptive_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.adaptive_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.bkt_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.mastery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.question_elo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.bandit_arms ENABLE ROW LEVEL SECURITY;

-- public schema
ALTER TABLE public.slide_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------------------------
-- 2. Configure Read-Only Educational / Metadata Policies (Allow anon SELECT)
-- -------------------------------------------------------------------------

-- app.courses
DROP POLICY IF EXISTS courses_select_policy ON app.courses;
CREATE POLICY courses_select_policy ON app.courses 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS courses_write_policy ON app.courses;
CREATE POLICY courses_write_policy ON app.courses 
    FOR ALL TO service_role USING (true);

-- app.concepts
DROP POLICY IF EXISTS concepts_select_policy ON app.concepts;
CREATE POLICY concepts_select_policy ON app.concepts 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS concepts_write_policy ON app.concepts;
CREATE POLICY concepts_write_policy ON app.concepts 
    FOR ALL TO service_role USING (true);

-- app.questions
DROP POLICY IF EXISTS questions_select_policy ON app.questions;
CREATE POLICY questions_select_policy ON app.questions 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS questions_write_policy ON app.questions;
CREATE POLICY questions_write_policy ON app.questions 
    FOR ALL TO service_role USING (true);

-- app.question_concepts
DROP POLICY IF EXISTS question_concepts_select_policy ON app.question_concepts;
CREATE POLICY question_concepts_select_policy ON app.question_concepts 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS question_concepts_write_policy ON app.question_concepts;
CREATE POLICY question_concepts_write_policy ON app.question_concepts 
    FOR ALL TO service_role USING (true);

-- app.question_hints
DROP POLICY IF EXISTS question_hints_select_policy ON app.question_hints;
CREATE POLICY question_hints_select_policy ON app.question_hints 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS question_hints_write_policy ON app.question_hints;
CREATE POLICY question_hints_write_policy ON app.question_hints 
    FOR ALL TO service_role USING (true);

-- app.course_materials
DROP POLICY IF EXISTS course_materials_select_policy ON app.course_materials;
CREATE POLICY course_materials_select_policy ON app.course_materials 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS course_materials_write_policy ON app.course_materials;
CREATE POLICY course_materials_write_policy ON app.course_materials 
    FOR ALL TO service_role USING (true);

-- app.material_chunks
DROP POLICY IF EXISTS material_chunks_select_policy ON app.material_chunks;
CREATE POLICY material_chunks_select_policy ON app.material_chunks 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS material_chunks_write_policy ON app.material_chunks;
CREATE POLICY material_chunks_write_policy ON app.material_chunks 
    FOR ALL TO service_role USING (true);

-- app.concept_relations
DROP POLICY IF EXISTS cr_select_policy ON app.concept_relations;
CREATE POLICY cr_select_policy ON app.concept_relations 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS cr_write_policy ON app.concept_relations;
CREATE POLICY cr_write_policy ON app.concept_relations 
    FOR ALL TO service_role USING (true);

-- public.slide_embeddings
DROP POLICY IF EXISTS slide_embeddings_select_policy ON public.slide_embeddings;
CREATE POLICY slide_embeddings_select_policy ON public.slide_embeddings 
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS slide_embeddings_write_policy ON public.slide_embeddings;
CREATE POLICY slide_embeddings_write_policy ON public.slide_embeddings 
    FOR ALL TO service_role USING (true);


-- -------------------------------------------------------------------------
-- 3. Configure Login & Signup Policies (Allow anon SELECT/INSERT)
-- -------------------------------------------------------------------------

-- app.users
DROP POLICY IF EXISTS "Allow select for login" ON app.users;
CREATE POLICY "Allow select for login" ON app.users
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS "Allow insert for signup" ON app.users;
CREATE POLICY "Allow insert for signup" ON app.users
    FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for users" ON app.users;
CREATE POLICY "Allow update for users" ON app.users
    FOR UPDATE TO service_role USING (true);

-- app.roles
DROP POLICY IF EXISTS "Allow select for login" ON app.roles;
CREATE POLICY "Allow select for login" ON app.roles
    FOR SELECT TO anon, authenticated, service_role USING (true);

-- app.user_roles
DROP POLICY IF EXISTS "Allow select for login" ON app.user_roles;
CREATE POLICY "Allow select for login" ON app.user_roles
    FOR SELECT TO anon, authenticated, service_role USING (true);
DROP POLICY IF EXISTS "Allow insert for signup" ON app.user_roles;
CREATE POLICY "Allow insert for signup" ON app.user_roles
    FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 4. Configure Survey Policies (Allow anon SELECT/INSERT/UPDATE)
-- -------------------------------------------------------------------------

-- public.surveys
DROP POLICY IF EXISTS "Allow public insert" ON public.surveys;
DROP POLICY IF EXISTS "Allow public update" ON public.surveys;
DROP POLICY IF EXISTS "Allow public select" ON public.surveys;
DROP POLICY IF EXISTS surveys_select_policy ON public.surveys;

CREATE POLICY surveys_insert_policy ON public.surveys
    FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
CREATE POLICY surveys_update_policy ON public.surveys
    FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);
CREATE POLICY surveys_select_policy ON public.surveys
    FOR SELECT TO anon, authenticated, service_role USING (true);


-- -------------------------------------------------------------------------
-- 5. System and Student Interactive Policies (Bypass RLS for service_role, restrict to auth.uid() for authenticated)
-- -------------------------------------------------------------------------

-- app.student_concept_mastery
DROP POLICY IF EXISTS scm_select_policy ON app.student_concept_mastery;
CREATE POLICY scm_select_policy ON app.student_concept_mastery 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS scm_write_policy ON app.student_concept_mastery;
CREATE POLICY scm_write_policy ON app.student_concept_mastery 
    FOR ALL TO service_role USING (true);

-- app.student_mastery_bitemporal
DROP POLICY IF EXISTS smb_select_policy ON app.student_mastery_bitemporal;
CREATE POLICY smb_select_policy ON app.student_mastery_bitemporal 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS smb_write_policy ON app.student_mastery_bitemporal;
CREATE POLICY smb_write_policy ON app.student_mastery_bitemporal 
    FOR ALL TO service_role USING (true);

-- app.chat_sessions
DROP POLICY IF EXISTS chat_sessions_select_policy ON app.chat_sessions;
CREATE POLICY chat_sessions_select_policy ON app.chat_sessions 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS chat_sessions_insert_policy ON app.chat_sessions;
CREATE POLICY chat_sessions_insert_policy ON app.chat_sessions 
    FOR INSERT TO authenticated, service_role WITH CHECK (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS chat_sessions_write_policy ON app.chat_sessions;
CREATE POLICY chat_sessions_write_policy ON app.chat_sessions 
    FOR ALL TO service_role USING (true);

-- app.chat_messages
DROP POLICY IF EXISTS chat_messages_select_policy ON app.chat_messages;
CREATE POLICY chat_messages_select_policy ON app.chat_messages 
    FOR SELECT TO authenticated, service_role USING (
        EXISTS (SELECT 1 FROM app.chat_sessions s WHERE s.id = session_id AND s.student_id = auth.uid()) OR auth.role() = 'service_role'
    );
DROP POLICY IF EXISTS chat_messages_insert_policy ON app.chat_messages;
CREATE POLICY chat_messages_insert_policy ON app.chat_messages 
    FOR INSERT TO authenticated, service_role WITH CHECK (
        EXISTS (SELECT 1 FROM app.chat_sessions s WHERE s.id = session_id AND s.student_id = auth.uid()) OR auth.role() = 'service_role'
    );
DROP POLICY IF EXISTS chat_messages_write_policy ON app.chat_messages;
CREATE POLICY chat_messages_write_policy ON app.chat_messages 
    FOR ALL TO service_role USING (true);

-- app.message_citations
DROP POLICY IF EXISTS message_citations_select_policy ON app.message_citations;
CREATE POLICY message_citations_select_policy ON app.message_citations 
    FOR SELECT TO authenticated, service_role USING (
        EXISTS (
            SELECT 1 FROM app.chat_messages m 
            JOIN app.chat_sessions s ON m.session_id = s.id 
            WHERE m.id = message_id AND s.student_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );
DROP POLICY IF EXISTS message_citations_write_policy ON app.message_citations;
CREATE POLICY message_citations_write_policy ON app.message_citations 
    FOR ALL TO service_role USING (true);

-- app.quiz_attempts
DROP POLICY IF EXISTS quiz_attempts_select_policy ON app.quiz_attempts;
CREATE POLICY quiz_attempts_select_policy ON app.quiz_attempts 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS quiz_attempts_insert_policy ON app.quiz_attempts;
CREATE POLICY quiz_attempts_insert_policy ON app.quiz_attempts 
    FOR INSERT TO authenticated, service_role WITH CHECK (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS quiz_attempts_write_policy ON app.quiz_attempts;
CREATE POLICY quiz_attempts_write_policy ON app.quiz_attempts 
    FOR ALL TO service_role USING (true);

-- app.student_memories
DROP POLICY IF EXISTS student_memories_select_policy ON app.student_memories;
CREATE POLICY student_memories_select_policy ON app.student_memories 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS student_memories_write_policy ON app.student_memories;
CREATE POLICY student_memories_write_policy ON app.student_memories 
    FOR ALL TO service_role USING (true);

-- app.course_members
DROP POLICY IF EXISTS course_members_select_policy ON app.course_members;
CREATE POLICY course_members_select_policy ON app.course_members 
    FOR SELECT TO authenticated, service_role USING (user_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS course_members_write_policy ON app.course_members;
CREATE POLICY course_members_write_policy ON app.course_members 
    FOR ALL TO service_role USING (true);

-- app.feedback_events
DROP POLICY IF EXISTS feedback_events_select_policy ON app.feedback_events;
CREATE POLICY feedback_events_select_policy ON app.feedback_events 
    FOR SELECT TO authenticated, service_role USING (user_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS feedback_events_insert_policy ON app.feedback_events;
CREATE POLICY feedback_events_insert_policy ON app.feedback_events 
    FOR INSERT TO authenticated, service_role WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS feedback_events_write_policy ON app.feedback_events;
CREATE POLICY feedback_events_write_policy ON app.feedback_events 
    FOR ALL TO service_role USING (true);

-- app.hint_logs
DROP POLICY IF EXISTS hint_logs_select_policy ON app.hint_logs;
CREATE POLICY hint_logs_select_policy ON app.hint_logs 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS hint_logs_insert_policy ON app.hint_logs;
CREATE POLICY hint_logs_insert_policy ON app.hint_logs 
    FOR INSERT TO authenticated, service_role WITH CHECK (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS hint_logs_write_policy ON app.hint_logs;
CREATE POLICY hint_logs_write_policy ON app.hint_logs 
    FOR ALL TO service_role USING (true);

-- app.learning_signals
DROP POLICY IF EXISTS learning_signals_select_policy ON app.learning_signals;
CREATE POLICY learning_signals_select_policy ON app.learning_signals 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS learning_signals_insert_policy ON app.learning_signals;
CREATE POLICY learning_signals_insert_policy ON app.learning_signals 
    FOR INSERT TO authenticated, service_role WITH CHECK (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS learning_signals_write_policy ON app.learning_signals;
CREATE POLICY learning_signals_write_policy ON app.learning_signals 
    FOR ALL TO service_role USING (true);

-- app.calibration_outbox
DROP POLICY IF EXISTS calibration_outbox_policy ON app.calibration_outbox;
CREATE POLICY calibration_outbox_policy ON app.calibration_outbox 
    FOR ALL TO service_role USING (true);

-- -------------------------------------------------------------------------
-- 6. Configure Audit Schema Policies (Allow service_role only)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_policies_all ON audit.adaptive_policies;
CREATE POLICY audit_policies_all ON audit.adaptive_policies FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS audit_decisions_all ON audit.adaptive_decisions;
CREATE POLICY audit_decisions_all ON audit.adaptive_decisions FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS audit_rewards_all ON audit.adaptive_rewards;
CREATE POLICY audit_rewards_all ON audit.adaptive_rewards FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS audit_bkt_all ON audit.bkt_parameters;
CREATE POLICY audit_bkt_all ON audit.bkt_parameters FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS audit_mastery_all ON audit.mastery_events;
CREATE POLICY audit_mastery_all ON audit.mastery_events FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS audit_elo_all ON audit.question_elo_events;
CREATE POLICY audit_elo_all ON audit.question_elo_events FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS audit_bandit_all ON audit.bandit_arms;
CREATE POLICY audit_bandit_all ON audit.bandit_arms FOR ALL TO service_role USING (true);

COMMIT;
