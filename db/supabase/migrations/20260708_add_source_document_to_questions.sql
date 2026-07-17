-- Migration: 20260708_add_source_document_to_questions.sql
-- Description: Add source_document_name column to app.questions for linking quiz questions to their source slide documents.
-- Target: Supabase PostgreSQL 17

ALTER TABLE app.questions
  ADD COLUMN IF NOT EXISTS source_document_name text;

COMMENT ON COLUMN app.questions.source_document_name
  IS 'Tên file PDF nguồn trong public.slide_embeddings (document_name). Dùng để thống kê quiz theo tài liệu.';

CREATE INDEX IF NOT EXISTS idx_questions_source_document
  ON app.questions (source_document_name)
  WHERE source_document_name IS NOT NULL;
