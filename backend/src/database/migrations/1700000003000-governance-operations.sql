CREATE TABLE IF NOT EXISTS app_minutes (
  id UUID PRIMARY KEY,
  meeting_id UUID NOT NULL,
  minute_taker_user_id VARCHAR(255),
  content_json JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS app_managed_users (
  id UUID PRIMARY KEY,
  microsoft_oid VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  roles_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS app_audit_logs (
  id UUID PRIMARY KEY,
  actor_user_id VARCHAR(255),
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id VARCHAR(255),
  changes_json JSONB,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_minutes_meeting ON app_minutes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_app_managed_users_updated_at ON app_managed_users(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_audit_logs_created_at ON app_audit_logs(created_at DESC);
