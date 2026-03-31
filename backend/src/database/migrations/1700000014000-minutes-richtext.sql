-- Adds rich_text_summary JSONB column to app_minutes for D4: Minutes Rich Text Editing

ALTER TABLE app_minutes ADD COLUMN IF NOT EXISTS rich_text_summary JSONB;
