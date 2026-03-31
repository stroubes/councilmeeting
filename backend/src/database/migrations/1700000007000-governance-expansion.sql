ALTER TABLE app_agenda_items
  ADD COLUMN IF NOT EXISTS is_public_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redaction_note TEXT,
  ADD COLUMN IF NOT EXISTS carry_forward_to_next BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE app_meeting_types
  ADD COLUMN IF NOT EXISTS wizard_config_json JSONB,
  ADD COLUMN IF NOT EXISTS standing_items_json JSONB;

CREATE TABLE IF NOT EXISTS app_resolutions (
  id UUID PRIMARY KEY,
  meeting_id UUID NOT NULL,
  agenda_item_id UUID,
  motion_id UUID,
  resolution_number VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  bylaw_number VARCHAR(100),
  moved_by VARCHAR(255),
  seconded_by VARCHAR(255),
  vote_for INTEGER NOT NULL DEFAULT 0,
  vote_against INTEGER NOT NULL DEFAULT 0,
  vote_abstain INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL,
  is_action_required BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_resolutions_meeting_id ON app_resolutions(meeting_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_resolutions_number ON app_resolutions(resolution_number);

CREATE TABLE IF NOT EXISTS app_action_items (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL,
  priority VARCHAR(30) NOT NULL,
  owner_user_id VARCHAR(255),
  due_date DATE,
  meeting_id UUID,
  resolution_id UUID,
  motion_id UUID,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_app_action_items_status ON app_action_items(status, due_date);
CREATE INDEX IF NOT EXISTS idx_app_action_items_owner ON app_action_items(owner_user_id);
