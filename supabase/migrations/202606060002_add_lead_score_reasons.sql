-- Add score_reasons and score_updated_at to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS score_reasons  jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS score_updated_at timestamptz;
