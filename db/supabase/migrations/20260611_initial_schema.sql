-- ============================================================================
-- ai20kekeke | Adaptive AI Tutor — Initial Schema (IDEMPOTENT)
-- Target: Supabase PostgreSQL 17 (mentora-dev)
-- Status: DEPLOYED on mentora-dev (nxpbxlmmrsliohkoeoac) — 2026-06-11
-- Re-run safe: YES — all statements use IF NOT EXISTS / OR REPLACE
-- ============================================================================
-- Đối chiếu:
--   PDR       → docs/product/project-overview-pdr.md
--   Arch      → docs/engineering/system-architecture.md
--   DB Docs   → db/README.md
--   DBML      → db/schema/adaptive-rbac.dbml
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector: embedding storage + HNSW search

-- ============================================================================
-- 2. SCHEMAS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS app;    -- Runtime: READ + UPDATE (serve API, UI)
CREATE SCHEMA IF NOT EXISTS audit;  -- Append-only: INSERT only (history, ML, debug)

-- ============================================================================
-- 3. ENUM TYPES (idempotent via DO $$ blocks)
-- ============================================================================

-- app enums
DO $$ BEGIN CREATE TYPE app.user_status       AS ENUM ('active', 'invited', 'disabled');                                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.course_status     AS ENUM ('draft', 'active', 'archived');                                      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.course_role       AS ENUM ('student', 'mentor', 'admin');                                       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.membership_status AS ENUM ('active', 'removed');                                                EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.publish_status    AS ENUM ('draft', 'published', 'archived');                                   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.embedding_status  AS ENUM ('pending', 'indexed', 'failed');                                     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.concept_status    AS ENUM ('active', 'archived');                                               EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.mastery_state     AS ENUM ('not_started', 'weak', 'learning', 'mastered');                      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.question_type     AS ENUM ('mcq', 'short_answer', 'code', 'flashcard');                         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.calibration_status AS ENUM ('draft', 'calibrating', 'published', 'retired');                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.grading_method    AS ENUM ('deterministic', 'ai', 'manual');                                    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.chat_mode         AS ENUM ('explain', 'hint', 'debug_code', 'practice', 'review_submission');   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.message_role      AS ENUM ('student', 'assistant', 'system');                                   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.policy_action     AS ENUM ('answer', 'hint', 'refuse', 'redirect', 'low_confidence');           EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.feedback_target   AS ENUM ('message', 'question', 'citation', 'quiz_attempt');                  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.feedback_type     AS ENUM ('helpful', 'unhelpful', 'incorrect', 'bad_citation', 'unsafe');      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE app.signal_type       AS ENUM ('chat', 'quiz', 'hint', 'review', 'feedback', 'guardrail');         EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- audit enums
DO $$ BEGIN CREATE TYPE audit.policy_status      AS ENUM ('draft', 'active', 'retired');                                   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit.decision_type      AS ENUM ('question', 'concept', 'review', 'hint_style');                  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit.exploration_mode   AS ENUM ('explore', 'exploit', 'fallback');                                EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit.mastery_source_type AS ENUM ('quiz_attempt', 'flashcard_review', 'manual_adjustment', 'diagnostic'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- 4. app.* TABLES — Runtime (17 tables)
-- ============================================================================

-- [T01] Auth & RBAC ─────────────────────────────────────────────── Sprint 4
CREATE TABLE IF NOT EXISTS app.users (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text        NOT NULL UNIQUE,
    password_hash text,
    full_name     text        NOT NULL,
    status        app.user_status NOT NULL DEFAULT 'active',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- [T02] Role lookup (3 rows: student, mentor, admin) ────────────── Sprint 4
CREATE TABLE IF NOT EXISTS app.roles (
    id   smallserial PRIMARY KEY,
    code app.course_role NOT NULL UNIQUE,
    name text NOT NULL
);

-- [T03] User ↔ Role (M:N) ──────────────────────────────────────── Sprint 4
CREATE TABLE IF NOT EXISTS app.user_roles (
    user_id    uuid     NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    role_id    smallint NOT NULL REFERENCES app.roles(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- [T04] Course management ───────────────────────────────────────── Sprint 1
CREATE TABLE IF NOT EXISTS app.courses (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    code       text        NOT NULL UNIQUE,
    title      text        NOT NULL,
    status     app.course_status NOT NULL DEFAULT 'draft',
    created_by uuid        REFERENCES app.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- [T05] RBAC per-course (ai là student/mentor/admin của khóa nào) ─ Sprint 4
CREATE TABLE IF NOT EXISTS app.course_members (
    course_id uuid             NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    user_id   uuid             NOT NULL REFERENCES app.users(id)   ON DELETE CASCADE,
    role_code app.course_role  NOT NULL,
    status    app.membership_status NOT NULL DEFAULT 'active',
    joined_at timestamptz      NOT NULL DEFAULT now(),
    PRIMARY KEY (course_id, user_id, role_code)
);

-- [T06] Knowledge graph nodes (parent-child hierarchy) ──────────── Sprint 2-3
CREATE TABLE IF NOT EXISTS app.concepts (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    code              text        NOT NULL,
    name              text        NOT NULL,
    description       text,
    parent_concept_id uuid        REFERENCES app.concepts(id) ON DELETE SET NULL,
    status            app.concept_status NOT NULL DEFAULT 'active',
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (course_id, code)
);

-- [T07] Material ingestion & draft/publish ──────────────────────── Sprint 1-3
CREATE TABLE IF NOT EXISTS app.course_materials (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    title            text        NOT NULL,
    source_type      text        NOT NULL,           -- 'pdf', 'pptx', 'md'
    storage_uri      text        NOT NULL,           -- Supabase Storage path
    published_status app.publish_status NOT NULL DEFAULT 'draft',
    uploaded_by      uuid        REFERENCES app.users(id) ON DELETE SET NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- [T08] RAG chunks + pgvector embedding ─────────────────────────── Sprint 2
CREATE TABLE IF NOT EXISTS app.material_chunks (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id      uuid        NOT NULL REFERENCES app.course_materials(id) ON DELETE CASCADE,
    course_id        uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    concept_id       uuid        REFERENCES app.concepts(id) ON DELETE SET NULL,
    chunk_index      integer     NOT NULL,
    page_number      integer,
    section_title    text,
    text_excerpt     text        NOT NULL,
    embedding        vector(1536),                   -- pgvector: OpenAI text-embedding-3-small
    embedding_status app.embedding_status NOT NULL DEFAULT 'pending',
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (material_id, chunk_index)
);

-- [T09] ★ CORE: Student mastery (Elo + BKT + ZPD) ──────────────── Sprint 2-3
CREATE TABLE IF NOT EXISTS app.student_concept_mastery (
    student_id             uuid        NOT NULL REFERENCES app.users(id)    ON DELETE CASCADE,
    course_id              uuid        NOT NULL REFERENCES app.courses(id)  ON DELETE CASCADE,
    concept_id             uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    elo_score              numeric(8,2) NOT NULL DEFAULT 1200,
    bkt_mastery_probability numeric(5,4) NOT NULL DEFAULT 0.2500
        CHECK (bkt_mastery_probability BETWEEN 0 AND 1),
    mastery_state          app.mastery_state NOT NULL DEFAULT 'not_started',
    weakness_flag          boolean     NOT NULL DEFAULT false,
    attempt_count          integer     NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    correct_count          integer     NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    last_practiced_at      timestamptz,
    updated_at             timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, course_id, concept_id),
    CHECK (correct_count <= attempt_count)
);

-- [T10] Question bank ───────────────────────────────────────────── Sprint 1-3
CREATE TABLE IF NOT EXISTS app.questions (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id          uuid        NOT NULL REFERENCES app.courses(id)          ON DELETE CASCADE,
    concept_id         uuid        NOT NULL REFERENCES app.concepts(id)         ON DELETE CASCADE,
    source_material_id uuid        REFERENCES app.course_materials(id)          ON DELETE SET NULL,
    type               app.question_type NOT NULL,
    prompt             text        NOT NULL,
    answer_key         jsonb       NOT NULL DEFAULT '{}'::jsonb,
    difficulty_elo     numeric(8,2) NOT NULL DEFAULT 1200,
    calibration_status app.calibration_status NOT NULL DEFAULT 'draft',
    created_by         uuid        REFERENCES app.users(id) ON DELETE SET NULL,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- [T11] Socratic hint ladder (3 levels per question) ────────────── Sprint 2-3
CREATE TABLE IF NOT EXISTS app.question_hints (
    id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid    NOT NULL REFERENCES app.questions(id) ON DELETE CASCADE,
    level       integer NOT NULL CHECK (level BETWEEN 1 AND 3),
    hint_text   text    NOT NULL,
    UNIQUE (question_id, level)
);

-- [T12] Quiz attempt log ────────────────────────────────────────── Sprint 2-3
--       (depends on audit.adaptive_decisions → created after A02 below)
--       NOTE: table order matters — audit.adaptive_policies & audit.adaptive_decisions
--             must exist before this table due to FK reference.

-- [A01] MOOClet Policy Engine config (versioned) ────────────────── Adaptive
--       (created here before T12 because adaptive_decisions depends on it)
CREATE TABLE IF NOT EXISTS audit.adaptive_policies (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text        NOT NULL,              -- 'zpd_selector', 'hint_style'
    version    text        NOT NULL,              -- 'v1.0', 'v2.0-beta'
    status     audit.policy_status NOT NULL DEFAULT 'draft',
    config     jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (name, version)
);

-- [A02] Contextual Bandit decision trace ────────────────────────── Adaptive
--       (created here before T12 because quiz_attempts FK references this)
CREATE TABLE IF NOT EXISTS audit.adaptive_decisions (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id            uuid        NOT NULL REFERENCES audit.adaptive_policies(id) ON DELETE RESTRICT,
    student_id           uuid        NOT NULL REFERENCES app.users(id)    ON DELETE CASCADE,
    course_id            uuid        NOT NULL REFERENCES app.courses(id)  ON DELETE CASCADE,
    concept_id           uuid        REFERENCES app.concepts(id)          ON DELETE SET NULL,
    decision_type        audit.decision_type NOT NULL DEFAULT 'question',
    selected_action_id   uuid,                    -- question_id hoặc concept_id được chọn
    selected_action_type text        NOT NULL DEFAULT 'question',
    candidate_action_ids jsonb       NOT NULL DEFAULT '[]'::jsonb,
    context_snapshot     jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- BKT + Elo tại thời điểm quyết định
    model_snapshot       jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- Bandit weights snapshot
    expected_reward      numeric(8,4),
    expected_success     numeric(5,4) CHECK (expected_success IS NULL OR expected_success BETWEEN 0 AND 1),
    exploration_mode     audit.exploration_mode NOT NULL DEFAULT 'exploit',
    reason_code          text,
    created_at           timestamptz NOT NULL DEFAULT now()
);

-- [T12] Quiz attempt log (now safe — audit.adaptive_decisions exists) ─ Sprint 2-3
CREATE TABLE IF NOT EXISTS app.quiz_attempts (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id           uuid        NOT NULL REFERENCES app.users(id)    ON DELETE CASCADE,
    course_id            uuid        NOT NULL REFERENCES app.courses(id)  ON DELETE CASCADE,
    question_id          uuid        NOT NULL REFERENCES app.questions(id) ON DELETE CASCADE,
    concept_id           uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    adaptive_decision_id uuid        REFERENCES audit.adaptive_decisions(id) ON DELETE SET NULL,
    student_answer       jsonb       NOT NULL DEFAULT '{}'::jsonb,
    is_correct           boolean,
    actual_score         numeric(5,4) NOT NULL CHECK (actual_score BETWEEN 0 AND 1),
    expected_success     numeric(5,4) CHECK (expected_success IS NULL OR expected_success BETWEEN 0 AND 1),
    hint_count           integer     NOT NULL DEFAULT 0 CHECK (hint_count >= 0),
    used_ai_help         boolean     NOT NULL DEFAULT false,
    grading_method       app.grading_method NOT NULL DEFAULT 'deterministic',
    submitted_at         timestamptz NOT NULL DEFAULT now()
);

-- [T13] Chat session (5 modes) ──────────────────────────────────── Sprint 2-3
CREATE TABLE IF NOT EXISTS app.chat_sessions (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid        NOT NULL REFERENCES app.users(id)   ON DELETE CASCADE,
    course_id  uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    mode       app.chat_mode NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at   timestamptz
);

-- [T14] Chat messages + guardrails ──────────────────────────────── Sprint 2-3
CREATE TABLE IF NOT EXISTS app.chat_messages (
    id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id                uuid        NOT NULL REFERENCES app.chat_sessions(id) ON DELETE CASCADE,
    role                      app.message_role NOT NULL,
    content                   text        NOT NULL,
    concept_id                uuid        REFERENCES app.concepts(id) ON DELETE SET NULL,
    rag_confidence            numeric(5,4) CHECK (rag_confidence IS NULL OR rag_confidence BETWEEN 0 AND 1),
    policy_action             app.policy_action,
    guardrail_flags           jsonb       NOT NULL DEFAULT '[]'::jsonb,
    adaptive_context_snapshot jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at                timestamptz NOT NULL DEFAULT now()
);

-- [T15] Citation cards (message → chunk) ────────────────────────── Sprint 2
CREATE TABLE IF NOT EXISTS app.message_citations (
    message_id    uuid    NOT NULL REFERENCES app.chat_messages(id)   ON DELETE CASCADE,
    chunk_id      uuid    NOT NULL REFERENCES app.material_chunks(id) ON DELETE CASCADE,
    rank          integer NOT NULL CHECK (rank > 0),
    quoted_excerpt text   NOT NULL,
    PRIMARY KEY (message_id, chunk_id)
);

-- [T16] User feedback (helpful/unhelpful) ───────────────────────── Sprint 3
CREATE TABLE IF NOT EXISTS app.feedback_events (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid        NOT NULL REFERENCES app.users(id)   ON DELETE CASCADE,
    course_id     uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    target_type   app.feedback_target NOT NULL,
    target_id     uuid        NOT NULL,
    feedback_type app.feedback_type NOT NULL,
    comment       text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- [T17] System telemetry ────────────────────────────────────────── Sprint 3-4
CREATE TABLE IF NOT EXISTS app.learning_signals (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   uuid        REFERENCES app.users(id)    ON DELETE CASCADE,
    course_id    uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    concept_id   uuid        REFERENCES app.concepts(id) ON DELETE SET NULL,
    signal_type  app.signal_type NOT NULL,
    signal_value jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at   timestamptz NOT NULL DEFAULT now()
);


-- ============================================================================
-- 5. audit.* TABLES — Append-only (remaining 4 tables)
--    NOTE: A01 & A02 created above (before T12) due to FK dependency order.
-- ============================================================================

-- [A03] Bandit reward signal (Y) ────────────────────────────────── Adaptive
CREATE TABLE IF NOT EXISTS audit.adaptive_rewards (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    adaptive_decision_id uuid        NOT NULL REFERENCES audit.adaptive_decisions(id) ON DELETE CASCADE,
    quiz_attempt_id      uuid        REFERENCES app.quiz_attempts(id) ON DELETE SET NULL,
    reward_value         numeric(8,4) NOT NULL,
    reward_formula       text        NOT NULL,     -- 'zpd_reward_v1'
    observed_success     numeric(5,4) CHECK (observed_success BETWEEN 0 AND 1),
    target_success       numeric(5,4) NOT NULL DEFAULT 0.7500
        CHECK (target_success BETWEEN 0 AND 1),
    reward_components    jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at           timestamptz NOT NULL DEFAULT now()
);

-- [A04] BKT parameters per concept (versioned) ──────────────────── Adaptive
CREATE TABLE IF NOT EXISTS audit.bkt_parameters (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        uuid        NOT NULL REFERENCES app.courses(id)  ON DELETE CASCADE,
    concept_id       uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    prior_learned    numeric(5,4) NOT NULL CHECK (prior_learned    BETWEEN 0 AND 1), -- P(L₀)
    transition_learn numeric(5,4) NOT NULL CHECK (transition_learn BETWEEN 0 AND 1), -- P(T)
    guess            numeric(5,4) NOT NULL CHECK (guess            BETWEEN 0 AND 1), -- P(G)
    slip             numeric(5,4) NOT NULL CHECK (slip             BETWEEN 0 AND 1), -- P(S)
    version          text        NOT NULL,
    status           audit.policy_status NOT NULL DEFAULT 'active',
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (concept_id, version)
);

-- [A05] Elo + BKT state transition log ──────────────────────────── Adaptive
CREATE TABLE IF NOT EXISTS audit.mastery_events (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          uuid        NOT NULL REFERENCES app.users(id)    ON DELETE CASCADE,
    course_id           uuid        NOT NULL REFERENCES app.courses(id)  ON DELETE CASCADE,
    concept_id          uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    source_type         audit.mastery_source_type NOT NULL,
    source_id           uuid,                     -- quiz_attempt_id hoặc flashcard_id
    elo_before          numeric(8,2) NOT NULL,
    elo_after           numeric(8,2) NOT NULL,
    elo_delta           numeric(8,2) NOT NULL,
    bkt_before          numeric(5,4) NOT NULL CHECK (bkt_before BETWEEN 0 AND 1),
    bkt_after           numeric(5,4) NOT NULL CHECK (bkt_after  BETWEEN 0 AND 1),
    bkt_delta           numeric(6,4) NOT NULL,
    state_before        app.mastery_state NOT NULL,
    state_after         app.mastery_state NOT NULL,
    parameters_snapshot jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- [A06] Question difficulty Elo transitions ─────────────────────── Adaptive
CREATE TABLE IF NOT EXISTS audit.question_elo_events (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         uuid        NOT NULL REFERENCES app.questions(id)      ON DELETE CASCADE,
    quiz_attempt_id     uuid        NOT NULL REFERENCES app.quiz_attempts(id)  ON DELETE CASCADE,
    difficulty_before   numeric(8,2) NOT NULL,
    difficulty_after    numeric(8,2) NOT NULL,
    difficulty_delta    numeric(8,2) NOT NULL,
    parameters_snapshot jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now()
);


-- ============================================================================
-- 6. SEED DATA
-- ============================================================================
INSERT INTO app.roles (code, name)
VALUES
    ('student', 'Student'),
    ('mentor',  'Mentor'),
    ('admin',   'Admin/BTC')
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- 7. INDEXES (17 composite + 1 HNSW) — all IF NOT EXISTS
-- ============================================================================

-- app indexes
CREATE INDEX IF NOT EXISTS idx_course_members_user_course         ON app.course_members (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_members_course_role          ON app.course_members (course_id, role_code);
CREATE INDEX IF NOT EXISTS idx_concepts_course_status              ON app.concepts (course_id, status);
CREATE INDEX IF NOT EXISTS idx_material_chunks_course_concept      ON app.material_chunks (course_id, concept_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_student_course      ON app.student_concept_mastery (student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_course_concept_state ON app.student_concept_mastery (course_id, concept_id, mastery_state);
CREATE INDEX IF NOT EXISTS idx_questions_course_concept_status     ON app.questions (course_id, concept_id, calibration_status);
CREATE INDEX IF NOT EXISTS idx_questions_concept_difficulty        ON app.questions (concept_id, difficulty_elo);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_course_time   ON app.quiz_attempts (student_id, course_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_question              ON app.quiz_attempts (question_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time          ON app.chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_events_course_time         ON app.feedback_events (course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_signals_course_type_time   ON app.learning_signals (course_id, signal_type, created_at DESC);

-- audit indexes
CREATE INDEX IF NOT EXISTS idx_adaptive_decisions_student_time     ON audit.adaptive_decisions (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adaptive_decisions_policy_time      ON audit.adaptive_decisions (policy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adaptive_rewards_decision           ON audit.adaptive_rewards (adaptive_decision_id);
CREATE INDEX IF NOT EXISTS idx_mastery_events_student_concept_time ON audit.mastery_events (student_id, concept_id, created_at DESC);

-- pgvector HNSW index — cosine similarity search on material chunks
CREATE INDEX IF NOT EXISTS idx_material_chunks_embedding ON app.material_chunks
    USING hnsw (embedding vector_cosine_ops);


-- ============================================================================
-- 8. VIEWS (3) — all CREATE OR REPLACE
-- ============================================================================

-- Course roster (danh sách thành viên)
CREATE OR REPLACE VIEW app.v_course_roster AS
SELECT
    c.id     AS course_id,
    c.code   AS course_code,
    c.title  AS course_title,
    u.id     AS user_id,
    u.email,
    u.full_name,
    cm.role_code,
    cm.status AS membership_status
FROM app.course_members cm
JOIN app.courses c ON c.id = cm.course_id
JOIN app.users   u ON u.id = cm.user_id;

-- Student mastery dashboard
CREATE OR REPLACE VIEW app.v_student_mastery_dashboard AS
SELECT
    scm.student_id,
    u.full_name     AS student_name,
    scm.course_id,
    c.title         AS course_title,
    scm.concept_id,
    co.name         AS concept_name,
    scm.elo_score,
    scm.bkt_mastery_probability,
    scm.mastery_state,
    scm.weakness_flag,
    scm.attempt_count,
    scm.correct_count,
    CASE
        WHEN scm.attempt_count = 0 THEN NULL
        ELSE round((scm.correct_count::numeric / scm.attempt_count), 4)
    END AS correct_rate,
    scm.last_practiced_at
FROM app.student_concept_mastery scm
JOIN app.users    u  ON u.id  = scm.student_id
JOIN app.courses  c  ON c.id  = scm.course_id
JOIN app.concepts co ON co.id = scm.concept_id;

-- Adaptive decision trace (bandit audit)
CREATE OR REPLACE VIEW audit.v_adaptive_decision_trace AS
SELECT
    ad.id                  AS decision_id,
    ap.name                AS policy_name,
    ap.version             AS policy_version,
    u.full_name            AS student_name,
    c.title                AS course_title,
    co.name                AS concept_name,
    ad.decision_type,
    ad.selected_action_type,
    ad.selected_action_id,
    ad.expected_success,
    ad.expected_reward,
    ad.exploration_mode,
    ar.reward_value,
    ar.observed_success,
    ad.reason_code,
    ad.created_at
FROM audit.adaptive_decisions ad
JOIN  audit.adaptive_policies ap ON ap.id = ad.policy_id
JOIN  app.users               u  ON u.id  = ad.student_id
JOIN  app.courses              c  ON c.id  = ad.course_id
LEFT JOIN app.concepts        co ON co.id = ad.concept_id
LEFT JOIN audit.adaptive_rewards ar ON ar.adaptive_decision_id = ad.id;

COMMIT;

-- ============================================================================
-- QUICK VERIFICATION QUERIES
-- ============================================================================
-- SELECT * FROM app.v_course_roster;
-- SELECT * FROM app.v_student_mastery_dashboard;
-- SELECT * FROM audit.v_adaptive_decision_trace;
-- SELECT table_schema, table_name
--   FROM information_schema.tables
--  WHERE table_schema IN ('app', 'audit')
--  ORDER BY table_schema, table_name;
