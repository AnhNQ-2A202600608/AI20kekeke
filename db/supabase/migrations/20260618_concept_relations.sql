-- ============================================================================
-- ai20kekeke | Concept Graph Relations (DATA-ADAPTIVE-GRAPH-HITL)
-- Target: Supabase PostgreSQL 17
-- Re-run safe: YES
-- ============================================================================

BEGIN;

-- 1. Khai báo các loại quan hệ học thuật và trạng thái phê duyệt (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'concept_relation_type' AND typnamespace = 'app'::regnamespace) THEN
        CREATE TYPE app.concept_relation_type AS ENUM (
            'Prerequisite_of',
            'Used_for',
            'Compare',
            'Conjunction',
            'Hyponym_of',
            'Evaluate_for',
            'Part_of'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'concept_relation_status' AND typnamespace = 'app'::regnamespace) THEN
        CREATE TYPE app.concept_relation_status AS ENUM (
            'draft',
            'approved',
            'rejected'
        );
    END IF;
END
$$;

-- 2. Tạo bảng quan hệ giữa các concept (concept_relations)
CREATE TABLE IF NOT EXISTS app.concept_relations (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id         uuid        NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    source_concept_id uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    target_concept_id uuid        NOT NULL REFERENCES app.concepts(id) ON DELETE CASCADE,
    relation_type     app.concept_relation_type NOT NULL,
    weight            numeric     NOT NULL DEFAULT 1.0,
    status            app.concept_relation_status NOT NULL DEFAULT 'draft',
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_concept_id, target_concept_id, relation_type),
    CONSTRAINT no_self_relation CHECK (source_concept_id <> target_concept_id)
);

-- 3. Tạo index phục vụ tối ưu hóa truy vấn cạnh trên đồ thị
CREATE INDEX IF NOT EXISTS idx_concept_relations_course ON app.concept_relations (course_id);
CREATE INDEX IF NOT EXISTS idx_concept_relations_source ON app.concept_relations (source_concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_relations_target ON app.concept_relations (target_concept_id);

COMMIT;
