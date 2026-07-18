-- Migration: Add validation_metadata JSONB column to app.questions
-- Description: Stores Critic Agent validation results, option length checking outcome, and retry count.

ALTER TABLE app.questions ADD COLUMN validation_metadata JSONB DEFAULT NULL;
