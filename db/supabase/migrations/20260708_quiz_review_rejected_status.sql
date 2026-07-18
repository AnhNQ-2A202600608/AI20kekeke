-- Migration: 20260708_quiz_review_rejected_status.sql
-- Description: Add 'rejected' status to calibration_status enum and add rejection_reason column to app.questions.
-- Target: Supabase PostgreSQL 17

-- 1. Add 'rejected' to calibration_status enum
-- PostgreSQL doesn't support IF NOT EXISTS for ADD VALUE directly inside transactions without DO block or catching exceptions,
-- but we can use DO block to be idempotent.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON t.oid = e.enumtypid 
        WHERE t.typname = 'calibration_status' 
          AND e.enumlabel = 'rejected'
    ) THEN
        ALTER TYPE app.calibration_status ADD VALUE 'rejected';
    END IF;
END $$;

-- 2. Add rejection_reason column to questions table
ALTER TABLE app.questions
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN app.questions.rejection_reason
  IS 'Lý do Mentor từ chối xuất bản câu hỏi này.';
