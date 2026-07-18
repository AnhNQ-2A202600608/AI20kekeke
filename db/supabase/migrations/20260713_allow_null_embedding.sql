-- Cho phép upload slide mà không cần OpenAI embedding.
-- Rows có embedding = NULL không ảnh hưởng match_slides RPC (chỉ dùng vector rows).
-- Safe nếu cột đã nullable: ALTER COLUMN ... DROP NOT NULL là idempotent.
DO $$
BEGIN
  ALTER TABLE public.slide_embeddings
    ALTER COLUMN embedding DROP NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'embedding column already nullable or table not found: %', SQLERRM;
END $$;
