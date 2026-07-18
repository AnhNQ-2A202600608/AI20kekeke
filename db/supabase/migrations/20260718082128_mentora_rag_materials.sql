-- Mentora normalized, scope-filtered RAG corpus.
-- Existing public.slide_embeddings remains untouched for legacy compatibility.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

CREATE TABLE app.rag_scopes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    grade_level smallint NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
    label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 160),
    is_pilot boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (course_id, subject_id, grade_level)
);

ALTER TABLE app.course_materials
    ADD COLUMN IF NOT EXISTS rag_scope_id uuid REFERENCES app.rag_scopes(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS source_filename text,
    ADD COLUMN IF NOT EXISTS source_checksum text,
    ADD COLUMN IF NOT EXISTS edition text,
    ADD COLUMN IF NOT EXISTS page_count integer CHECK (page_count IS NULL OR page_count > 0),
    ADD COLUMN IF NOT EXISTS ingest_status text NOT NULL DEFAULT 'queued'
        CHECK (ingest_status IN ('queued', 'processing', 'ready', 'published', 'failed'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_course_materials_scope_checksum
    ON app.course_materials (rag_scope_id, source_checksum)
    WHERE rag_scope_id IS NOT NULL AND source_checksum IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_course_materials_scope_publish
    ON app.course_materials (rag_scope_id, published_status, updated_at DESC);

CREATE TABLE app.material_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES app.course_materials(id) ON DELETE CASCADE,
    page_number integer NOT NULL CHECK (page_number > 0),
    extracted_text text NOT NULL DEFAULT '',
    extraction_method text NOT NULL
        CHECK (extraction_method IN ('markdown', 'ocr', 'non_text')),
    preview_storage_path text NOT NULL,
    content_checksum text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (material_id, page_number)
);

ALTER TABLE app.material_chunks
    ADD COLUMN IF NOT EXISTS page_id uuid REFERENCES app.material_pages(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS chunk_checksum text,
    ADD COLUMN IF NOT EXISTS embedding_model text NOT NULL DEFAULT 'text-embedding-3-small';

ALTER TABLE app.material_chunks
    ALTER COLUMN embedding TYPE vector(1536)
    USING embedding::vector(1536);

CREATE UNIQUE INDEX IF NOT EXISTS idx_material_chunks_page_checksum
    ON app.material_chunks (page_id, chunk_checksum)
    WHERE page_id IS NOT NULL AND chunk_checksum IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_material_chunks_embedding
    ON app.material_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE app.rag_ingestion_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid REFERENCES app.course_materials(id) ON DELETE CASCADE,
    requested_by uuid REFERENCES app.users(id) ON DELETE SET NULL,
    source_filename text NOT NULL,
    source_checksum text NOT NULL,
    status text NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'published', 'failed')),
    stage text NOT NULL DEFAULT 'queued'
        CHECK (stage IN ('queued', 'validating', 'extracting', 'rendering', 'chunking', 'embedding', 'publishing', 'done')),
    processed_pages integer NOT NULL DEFAULT 0 CHECK (processed_pages >= 0),
    total_pages integer NOT NULL DEFAULT 0 CHECK (total_pages >= 0),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    error_message text,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_ingestion_jobs_status_created
    ON app.rag_ingestion_jobs (status, created_at);

CREATE OR REPLACE FUNCTION app.match_material_chunks(
    query_embedding vector(1536),
    p_rag_scope_id uuid,
    match_threshold double precision DEFAULT 0.35,
    match_count integer DEFAULT 5
)
RETURNS TABLE (
    chunk_id uuid,
    material_id uuid,
    document_name text,
    page_number integer,
    content text,
    similarity double precision,
    preview_storage_path text,
    grade_level smallint,
    subject_code text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = app, public, pg_temp
AS $$
    SELECT
        c.id AS chunk_id,
        m.id AS material_id,
        m.title AS document_name,
        c.page_number,
        c.text_excerpt AS content,
        1 - (c.embedding <=> query_embedding) AS similarity,
        p.preview_storage_path,
        rs.grade_level,
        s.code AS subject_code
    FROM app.material_chunks c
    JOIN app.course_materials m ON m.id = c.material_id
    JOIN app.rag_scopes rs ON rs.id = m.rag_scope_id
    JOIN public.subjects s ON s.id = rs.subject_id
    LEFT JOIN app.material_pages p ON p.id = c.page_id
    WHERE m.published_status = 'published'
      AND m.rag_scope_id = p_rag_scope_id
      AND rs.is_active
      AND c.embedding_status = 'indexed'
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> query_embedding) >= match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT LEAST(GREATEST(match_count, 1), 20);
$$;

CREATE OR REPLACE FUNCTION app.publish_rag_material(p_material_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = app, pg_temp
AS $$
DECLARE
    target_scope uuid;
    target_title text;
    target_status text;
BEGIN
    SELECT rag_scope_id, title, ingest_status
      INTO target_scope, target_title, target_status
      FROM app.course_materials
     WHERE id = p_material_id
     FOR UPDATE;

    IF target_scope IS NULL THEN
        RAISE EXCEPTION 'RAG material % does not exist or has no scope', p_material_id;
    END IF;
    IF target_status <> 'ready' THEN
        RAISE EXCEPTION 'RAG material % is not ready', p_material_id;
    END IF;

    UPDATE app.course_materials
       SET published_status = 'archived', updated_at = now()
     WHERE rag_scope_id = target_scope
       AND lower(title) = lower(target_title)
       AND id <> p_material_id
       AND published_status = 'published';

    UPDATE app.course_materials
       SET published_status = 'published', ingest_status = 'published', updated_at = now()
     WHERE id = p_material_id;

    UPDATE app.rag_ingestion_jobs
       SET status = 'published', stage = 'done', finished_at = now(), updated_at = now()
     WHERE material_id = p_material_id AND status <> 'published';
END;
$$;

ALTER TABLE app.rag_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.material_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.rag_ingestion_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rag_scopes_service_role ON app.rag_scopes;
CREATE POLICY rag_scopes_service_role ON app.rag_scopes
    FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS material_pages_service_role ON app.material_pages;
CREATE POLICY material_pages_service_role ON app.material_pages
    FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS rag_ingestion_jobs_service_role ON app.rag_ingestion_jobs;
CREATE POLICY rag_ingestion_jobs_service_role ON app.rag_ingestion_jobs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS course_materials_select_policy ON app.course_materials;
DROP POLICY IF EXISTS material_chunks_select_policy ON app.material_chunks;

REVOKE ALL ON app.rag_scopes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON app.material_pages FROM PUBLIC, anon, authenticated;
REVOKE ALL ON app.rag_ingestion_jobs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON app.course_materials FROM anon, authenticated;
REVOKE ALL ON app.material_chunks FROM anon, authenticated;

GRANT ALL ON app.rag_scopes TO service_role;
GRANT ALL ON app.material_pages TO service_role;
GRANT ALL ON app.rag_ingestion_jobs TO service_role;
GRANT ALL ON app.course_materials TO service_role;
GRANT ALL ON app.material_chunks TO service_role;

REVOKE ALL ON FUNCTION app.match_material_chunks(vector, uuid, double precision, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.match_material_chunks(vector, uuid, double precision, integer)
    TO service_role;
REVOKE ALL ON FUNCTION app.publish_rag_material(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.publish_rag_material(uuid) TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'rag-materials',
    'rag-materials',
    false,
    104857600,
    ARRAY['application/pdf', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO app.rag_scopes (course_id, subject_id, grade_level, label, is_pilot)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    subjects.id,
    6,
    CASE subjects.code
        WHEN 'mathematics' THEN 'Lớp 6 · Toán'
        WHEN 'history-geography' THEN 'Lớp 6 · Lịch sử và Địa lí'
    END,
    true
FROM public.subjects
WHERE subjects.code IN ('mathematics', 'history-geography')
ON CONFLICT (course_id, subject_id, grade_level) DO UPDATE SET
    label = EXCLUDED.label,
    is_pilot = true,
    is_active = true,
    updated_at = now();
