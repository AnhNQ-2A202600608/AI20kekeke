-- ============================================================================
-- C2-App-125 | Enable RLS and Configure Row-Level Security Policies
-- Target: Supabase PostgreSQL 17 (mentora-dev / mentora)
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Read-Only Educational / Metadata Tables
-- -------------------------------------------------------------------------

-- app.courses
ALTER TABLE app.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS courses_select_policy ON app.courses;
CREATE POLICY courses_select_policy ON app.courses 
    FOR SELECT TO authenticated, service_role USING (true);
DROP POLICY IF EXISTS courses_write_policy ON app.courses;
CREATE POLICY courses_write_policy ON app.courses 
    FOR ALL TO service_role USING (true);

-- app.concepts
ALTER TABLE app.concepts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS concepts_select_policy ON app.concepts;
CREATE POLICY concepts_select_policy ON app.concepts 
    FOR SELECT TO authenticated, service_role USING (true);
DROP POLICY IF EXISTS concepts_write_policy ON app.concepts;
CREATE POLICY concepts_write_policy ON app.concepts 
    FOR ALL TO service_role USING (true);

-- app.questions
ALTER TABLE app.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS questions_select_policy ON app.questions;
CREATE POLICY questions_select_policy ON app.questions 
    FOR SELECT TO authenticated, service_role USING (true);
DROP POLICY IF EXISTS questions_write_policy ON app.questions;
CREATE POLICY questions_write_policy ON app.questions 
    FOR ALL TO service_role USING (true);

-- app.question_concepts
ALTER TABLE app.question_concepts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS question_concepts_select_policy ON app.question_concepts;
CREATE POLICY question_concepts_select_policy ON app.question_concepts 
    FOR SELECT TO authenticated, service_role USING (true);
DROP POLICY IF EXISTS question_concepts_write_policy ON app.question_concepts;
CREATE POLICY question_concepts_write_policy ON app.question_concepts 
    FOR ALL TO service_role USING (true);

-- app.question_hints
ALTER TABLE app.question_hints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS question_hints_select_policy ON app.question_hints;
CREATE POLICY question_hints_select_policy ON app.question_hints 
    FOR SELECT TO authenticated, service_role USING (true);
DROP POLICY IF EXISTS question_hints_write_policy ON app.question_hints;
CREATE POLICY question_hints_write_policy ON app.question_hints 
    FOR ALL TO service_role USING (true);

-- app.course_materials
ALTER TABLE app.course_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_materials_select_policy ON app.course_materials;
CREATE POLICY course_materials_select_policy ON app.course_materials 
    FOR SELECT TO authenticated, service_role USING (true);
DROP POLICY IF EXISTS course_materials_write_policy ON app.course_materials;
CREATE POLICY course_materials_write_policy ON app.course_materials 
    FOR ALL TO service_role USING (true);

-- app.material_chunks
ALTER TABLE app.material_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS material_chunks_select_policy ON app.material_chunks;
CREATE POLICY material_chunks_select_policy ON app.material_chunks 
    FOR SELECT TO authenticated, service_role USING (true);
DROP POLICY IF EXISTS material_chunks_write_policy ON app.material_chunks;
CREATE POLICY material_chunks_write_policy ON app.material_chunks 
    FOR ALL TO service_role USING (true);

-- public.slide_embeddings
ALTER TABLE public.slide_embeddings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS slide_embeddings_select_policy ON public.slide_embeddings;
CREATE POLICY slide_embeddings_select_policy ON public.slide_embeddings 
    FOR SELECT TO authenticated, service_role USING (true);
DROP POLICY IF EXISTS slide_embeddings_write_policy ON public.slide_embeddings;
CREATE POLICY slide_embeddings_write_policy ON public.slide_embeddings 
    FOR ALL TO service_role USING (true);


-- -------------------------------------------------------------------------
-- 2. Student Personal / Session / Interactive Tables
-- -------------------------------------------------------------------------

-- app.chat_sessions
ALTER TABLE app.chat_sessions ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE app.chat_messages ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE app.message_citations ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE app.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quiz_attempts_select_policy ON app.quiz_attempts;
CREATE POLICY quiz_attempts_select_policy ON app.quiz_attempts 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS quiz_attempts_insert_policy ON app.quiz_attempts;
CREATE POLICY quiz_attempts_insert_policy ON app.quiz_attempts 
    FOR INSERT TO authenticated, service_role WITH CHECK (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS quiz_attempts_write_policy ON app.quiz_attempts;
CREATE POLICY quiz_attempts_write_policy ON app.quiz_attempts 
    FOR ALL TO service_role USING (true);

-- app.student_mastery_bitemporal
ALTER TABLE app.student_mastery_bitemporal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS smb_select_policy ON app.student_mastery_bitemporal;
CREATE POLICY smb_select_policy ON app.student_mastery_bitemporal 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS smb_write_policy ON app.student_mastery_bitemporal;
CREATE POLICY smb_write_policy ON app.student_mastery_bitemporal 
    FOR ALL TO service_role USING (true);

-- app.student_memories
ALTER TABLE app.student_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_memories_select_policy ON app.student_memories;
CREATE POLICY student_memories_select_policy ON app.student_memories 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS student_memories_write_policy ON app.student_memories;
CREATE POLICY student_memories_write_policy ON app.student_memories 
    FOR ALL TO service_role USING (true);

-- app.course_members
ALTER TABLE app.course_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_members_select_policy ON app.course_members;
CREATE POLICY course_members_select_policy ON app.course_members 
    FOR SELECT TO authenticated, service_role USING (user_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS course_members_write_policy ON app.course_members;
CREATE POLICY course_members_write_policy ON app.course_members 
    FOR ALL TO service_role USING (true);

-- app.feedback_events
ALTER TABLE app.feedback_events ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE app.hint_logs ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE app.learning_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS learning_signals_select_policy ON app.learning_signals;
CREATE POLICY learning_signals_select_policy ON app.learning_signals 
    FOR SELECT TO authenticated, service_role USING (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS learning_signals_insert_policy ON app.learning_signals;
CREATE POLICY learning_signals_insert_policy ON app.learning_signals 
    FOR INSERT TO authenticated, service_role WITH CHECK (student_id = auth.uid() OR auth.role() = 'service_role');
DROP POLICY IF EXISTS learning_signals_write_policy ON app.learning_signals;
CREATE POLICY learning_signals_write_policy ON app.learning_signals 
    FOR ALL TO service_role USING (true);


-- -------------------------------------------------------------------------
-- 3. System-Only Tables
-- -------------------------------------------------------------------------

-- app.calibration_outbox
ALTER TABLE app.calibration_outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calibration_outbox_policy ON app.calibration_outbox;
CREATE POLICY calibration_outbox_policy ON app.calibration_outbox 
    FOR ALL TO service_role USING (true);

COMMIT;
