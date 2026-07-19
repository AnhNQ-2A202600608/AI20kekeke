BEGIN;

-- ====================================================================
-- 1. Bảng bộ đề thi
-- ====================================================================
CREATE TABLE IF NOT EXISTS app.exam_sets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    code             TEXT NOT NULL,            -- 'midterm-2026', 'final-term-6'
    title            TEXT NOT NULL,
    description      TEXT,
    exam_type        TEXT NOT NULL CHECK (exam_type IN ('midterm', 'final', 'diagnostic', 'mock')),
    difficulty       TEXT NOT NULL DEFAULT 'bình thường',
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    max_score        NUMERIC(5,2) NOT NULL DEFAULT 10.0,
    status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'retired')),
    created_by       UUID REFERENCES app.users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, code)                   -- code unique trong phạm vi từng course
);

-- ====================================================================
-- 2. Junction: bộ đề ↔ câu hỏi
-- ====================================================================
CREATE TABLE IF NOT EXISTS app.exam_questions (
    exam_set_id UUID    NOT NULL REFERENCES app.exam_sets(id) ON DELETE CASCADE,
    question_id UUID    NOT NULL REFERENCES app.questions(id) ON DELETE RESTRICT,
    -- RESTRICT: không cho xóa câu hỏi khi đang thuộc đề thi
    sort_order  INTEGER NOT NULL DEFAULT 0,
    weight      NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0),
    PRIMARY KEY (exam_set_id, question_id)
);

-- ====================================================================
-- 3. Lượt thi tổng thể
-- ====================================================================
CREATE TABLE IF NOT EXISTS app.exam_attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    exam_set_id  UUID NOT NULL REFERENCES app.exam_sets(id) ON DELETE RESTRICT,
    -- RESTRICT: không cho xóa bộ đề khi đã có lượt thi
    started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ,              -- started_at + duration_minutes (set lúc start)
    submitted_at TIMESTAMPTZ,
    final_score  NUMERIC(5,2),            -- Điểm quy đổi (0..max_score)
    status       TEXT NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress', 'submitted', 'expired')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 4. Liên kết quiz_attempts (lịch sử từng câu) ↔ exam_attempts (lượt thi)
--    SET NULL để KHÔNG mất lịch sử Elo/BKT khi exam_attempt bị xóa
-- ====================================================================
ALTER TABLE app.quiz_attempts
    ADD COLUMN IF NOT EXISTS exam_attempt_id UUID
    REFERENCES app.exam_attempts(id) ON DELETE SET NULL;

-- ====================================================================
-- 5. Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_exam_sets_course_status    ON app.exam_sets(course_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_sets_code             ON app.exam_sets(code);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_set    ON app.exam_questions(exam_set_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question    ON app.exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student      ON app.exam_attempts(student_id, exam_set_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status       ON app.exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_exam_attempt ON app.quiz_attempts(exam_attempt_id);

-- ====================================================================
-- 6. RLS
-- ====================================================================
ALTER TABLE app.exam_sets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.exam_attempts  ENABLE ROW LEVEL SECURITY;

-- exam_sets: student chỉ thấy 'published'; mentor/admin thấy tất cả
CREATE POLICY exam_sets_student_select ON app.exam_sets
    FOR SELECT TO authenticated
    USING (status = 'published' OR (auth.jwt() ->> 'role') IN ('mentor', 'admin', 'dev'));

CREATE POLICY exam_sets_staff_all ON app.exam_sets
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'role') IN ('mentor', 'admin', 'dev'));

-- exam_questions: student thấy câu hỏi của đề đã published
CREATE POLICY exam_questions_select ON app.exam_questions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app.exam_sets e
            WHERE e.id = exam_set_id AND e.status = 'published'
        )
        OR (auth.jwt() ->> 'role') IN ('mentor', 'admin', 'dev')
    );

CREATE POLICY exam_questions_staff_all ON app.exam_questions
    FOR ALL TO authenticated
    USING ((auth.jwt() ->> 'role') IN ('mentor', 'admin', 'dev'));

-- exam_attempts: student chỉ thao tác với attempt của chính mình
CREATE POLICY exam_attempts_student_select ON app.exam_attempts
    FOR SELECT TO authenticated
    USING (student_id = auth.uid() OR (auth.jwt() ->> 'role') IN ('mentor', 'admin', 'dev'));

CREATE POLICY exam_attempts_student_insert ON app.exam_attempts
    FOR INSERT TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY exam_attempts_student_update ON app.exam_attempts
    FOR UPDATE TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON app.exam_sets      TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.exam_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON app.exam_attempts  TO authenticated;

COMMIT;
