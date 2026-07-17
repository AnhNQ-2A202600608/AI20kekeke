-- Optimize RAG vector retrieval latency while preserving the existing RPC contract.
-- The previous PL/pgSQL function filtered by similarity before ordering, which
-- forced a slower full scan shape. This SQL function ranks nearest candidates
-- first, then applies the threshold to the small candidate set.

CREATE OR REPLACE FUNCTION public.match_slides (
  query_embedding VECTOR(1536),
  match_threshold double precision,
  match_count integer,
  filter_document_regex text DEFAULT NULL
)
RETURNS TABLE (
  id integer,
  document_name text,
  slide_number integer,
  content text,
  similarity double precision,
  image_url text
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT *
  FROM (
    SELECT
      slide_embeddings.id,
      slide_embeddings.document_name,
      slide_embeddings.slide_number,
      slide_embeddings.content,
      1 - (slide_embeddings.embedding <=> query_embedding) AS similarity,
      slide_embeddings.image_url
    FROM public.slide_embeddings
    WHERE filter_document_regex IS NULL
      OR slide_embeddings.document_name ~* filter_document_regex
    ORDER BY slide_embeddings.embedding <=> query_embedding ASC
    LIMIT least(greatest(match_count * 4, match_count), 50)
  ) nearest
  WHERE nearest.similarity > match_threshold
  LIMIT match_count;
$$;
