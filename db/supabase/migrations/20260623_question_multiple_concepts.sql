-- ============================================================================
-- C2-App-125 | Add question_concepts table for many-to-many relationship
-- Target: Supabase PostgreSQL 17
-- ============================================================================

BEGIN;

-- Create the junction table for many-to-many relationship between questions and concepts
CREATE TABLE IF NOT EXISTS app.question_concepts (
    question_id  uuid        NOT NULL REFERENCES app.questions(id) ON DELETE CASCADE,
    concept_id   uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (question_id, concept_id)
);

-- Create index for faster querying by concept_id
CREATE INDEX IF NOT EXISTS idx_question_concepts_concept_id ON app.question_concepts(concept_id);

-- Migrate existing data from app.questions to app.question_concepts (if any)
INSERT INTO app.question_concepts (question_id, concept_id)
SELECT id, concept_id
FROM app.questions
ON CONFLICT (question_id, concept_id) DO NOTHING;

COMMIT;
