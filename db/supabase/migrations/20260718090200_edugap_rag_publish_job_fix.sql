-- Publishing a material must not rewrite historical failed/retried jobs.
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
     WHERE material_id = p_material_id
       AND status = 'processing';
END;
$$;

UPDATE app.rag_ingestion_jobs
   SET status = 'failed', updated_at = now()
 WHERE error_message = 'Superseded by retry'
   AND processed_pages = 0;

REVOKE ALL ON FUNCTION app.publish_rag_material(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.publish_rag_material(uuid) TO service_role;
