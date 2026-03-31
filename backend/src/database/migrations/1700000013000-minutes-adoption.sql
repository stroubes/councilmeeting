-- Adds adopted_at and adopted_by columns to app_minutes for D2: Minutes Adoption Workflow

ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS adopted_at TIMESTAMPTZ;
ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS adopted_by VARCHAR(255);
