-- Adds meeting-level publish status and published_at timestamp for R1: Publishing Pipeline

ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS publish_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE app_meetings ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_app_meetings_publish_status ON app_meetings(publish_status);

-- Constraints to enforce valid status transitions will be handled at the application level
