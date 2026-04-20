-- Adds publish_status to agenda items for R1: Publishing Pipeline
-- Controls per-item visibility in the participant portal

ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS publish_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT';

CREATE INDEX IF NOT EXISTS idx_app_agenda_items_publish_status ON app_agenda_items(publish_status);
