-- ============================================================================
-- C2-App-125 | Math Knowledge Graph: provenance columns, question_concepts role,
-- misconceptions table
-- Target: Supabase PostgreSQL 17
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- 1. Provenance: trace concept/relation back to source PDF + page.
--    Populated from the "<!-- page: N -->" marker emitted by the PDF->Markdown
--    vision extraction step. Nullable because existing AI-bootcamp rows have
--    no PDF source.
ALTER TABLE app.concepts
    ADD COLUMN IF NOT EXISTS source_document text,
    ADD COLUMN IF NOT EXISTS source_page     integer;

ALTER TABLE app.concept_relations
    ADD COLUMN IF NOT EXISTS source_document text,
    ADD COLUMN IF NOT EXISTS source_page     integer;

-- 2. question_concepts: role of a concept relative to a question (Q-matrix).
--    Default 'target' keeps existing rows backward compatible.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_concept_role' AND typnamespace = 'app'::regnamespace) THEN
        CREATE TYPE app.question_concept_role AS ENUM (
            'target',
            'prerequisite',
            'supporting',
            'confounder'
        );
    END IF;
END
$$;

ALTER TABLE app.question_concepts
    ADD COLUMN IF NOT EXISTS role app.question_concept_role NOT NULL DEFAULT 'target';

-- 3. Misconceptions: minimal schema for MVP. One misconception can relate to
--    multiple concepts (e.g. a fraction-addition error touches both
--    "same-denominator addition" and "fraction equivalence").
CREATE TABLE IF NOT EXISTS app.misconceptions (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id            uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    name                 text        NOT NULL,
    description          text,
    related_concept_ids  uuid[]      NOT NULL DEFAULT '{}',
    observable_pattern   text,
    source_document      text,
    source_page          integer,
    review_status        app.concept_relation_status NOT NULL DEFAULT 'draft',
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_misconceptions_course ON app.misconceptions (course_id);

COMMIT;
