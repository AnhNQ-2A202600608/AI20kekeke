-- Cập nhật hàm match_slides nhận thêm tham số lọc bằng biểu thức chính quy (Regex)
DROP FUNCTION IF EXISTS match_slides(vector,double precision,integer);
DROP FUNCTION IF EXISTS match_slides(vector,double precision,integer,text);

CREATE OR REPLACE FUNCTION match_slides (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_document_regex TEXT DEFAULT NULL
)
RETURNS TABLE (
  id INT,
  document_name TEXT,
  slide_number INT,
  content TEXT,
  similarity FLOAT,
  image_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    slide_embeddings.id,
    slide_embeddings.document_name,
    slide_embeddings.slide_number,
    slide_embeddings.content,
    1 - (slide_embeddings.embedding <=> query_embedding) AS similarity,
    slide_embeddings.image_url
  FROM slide_embeddings
  WHERE 1 - (slide_embeddings.embedding <=> query_embedding) > match_threshold
    AND (filter_document_regex IS NULL OR slide_embeddings.document_name ~* filter_document_regex)
  ORDER BY slide_embeddings.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
