CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status_enum') THEN
    CREATE TYPE record_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status_enum') THEN
    CREATE TYPE meeting_status_enum AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'ADJOURNED', 'CANCELLED', 'COMPLETED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_status_enum') THEN
    CREATE TYPE agenda_status_enum AS ENUM ('DRAFT', 'PENDING_DIRECTOR_APPROVAL', 'PENDING_CAO_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_item_type_enum') THEN
    CREATE TYPE agenda_item_type_enum AS ENUM ('SECTION', 'STAFF_REPORT', 'MOTION', 'BYLAW', 'INFO_ITEM', 'CONSENT_ITEM', 'OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agenda_item_status_enum') THEN
    CREATE TYPE agenda_item_status_enum AS ENUM ('DRAFT', 'PENDING_DIRECTOR_APPROVAL', 'PENDING_CAO_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_stage_enum') THEN
    CREATE TYPE approval_stage_enum AS ENUM ('DIRECTOR', 'CAO');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_action_enum') THEN
    CREATE TYPE approval_action_enum AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'RESUBMITTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vote_value_enum') THEN
    CREATE TYPE vote_value_enum AS ENUM ('YEA', 'NAY', 'ABSTAIN', 'ABSENT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  status record_status_enum NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(150) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  module VARCHAR(100) NOT NULL,
  status record_status_enum NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microsoft_oid VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  display_name VARCHAR(255),
  title VARCHAR(255),
  department VARCHAR(255),
  phone VARCHAR(50),
  primary_role_id UUID REFERENCES roles(id),
  is_council_member BOOLEAN NOT NULL DEFAULT FALSE,
  is_external BOOLEAN NOT NULL DEFAULT FALSE,
  status record_status_enum NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  is_in_camera BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  status record_status_enum NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type_id UUID NOT NULL REFERENCES meeting_types(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  meeting_number VARCHAR(50),
  location VARCHAR(255),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status meeting_status_enum NOT NULL DEFAULT 'SCHEDULED',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  video_url TEXT,
  livestream_embed_url TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_meeting_time CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS meeting_access_overrides (
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS agenda_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  applies_to_meeting_type_id UUID REFERENCES meeting_types(id),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  template_structure_json JSONB NOT NULL,
  source_sharepoint_site_id VARCHAR(255),
  source_sharepoint_drive_id VARCHAR(255),
  source_sharepoint_item_id VARCHAR(255),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  template_id UUID REFERENCES agenda_templates(id),
  title VARCHAR(255) NOT NULL,
  status agenda_status_enum NOT NULL DEFAULT 'DRAFT',
  version INTEGER NOT NULL DEFAULT 1,
  submitted_for_director_at TIMESTAMPTZ,
  submitted_for_cao_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id UUID NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
  parent_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
  item_type agenda_item_type_enum NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  status agenda_item_status_enum NOT NULL DEFAULT 'DRAFT',
  is_in_camera BOOLEAN NOT NULL DEFAULT FALSE,
  is_public_visible BOOLEAN NOT NULL DEFAULT TRUE,
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  approved_by_director UUID REFERENCES users(id),
  approved_by_director_at TIMESTAMPTZ,
  approved_by_cao UUID REFERENCES users(id),
  approved_by_cao_at TIMESTAMPTZ,
  rejection_reason TEXT,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_agenda_sort UNIQUE (agenda_id, sort_order)
);

CREATE TABLE IF NOT EXISTS staff_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID NOT NULL UNIQUE REFERENCES agenda_items(id) ON DELETE CASCADE,
  report_number VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  author_user_id UUID NOT NULL REFERENCES users(id),
  department VARCHAR(255),
  executive_summary TEXT,
  recommendations TEXT,
  financial_impact TEXT,
  legal_impact TEXT,
  raw_docx_file_name VARCHAR(500),
  source_sharepoint_site_id VARCHAR(255),
  source_sharepoint_drive_id VARCHAR(255),
  source_sharepoint_item_id VARCHAR(255),
  source_sharepoint_web_url TEXT,
  parsed_content_json JSONB NOT NULL,
  parsing_version VARCHAR(50) NOT NULL DEFAULT '1.0',
  parsing_warnings_json JSONB,
  workflow_status agenda_item_status_enum NOT NULL DEFAULT 'DRAFT',
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_report_id UUID NOT NULL REFERENCES staff_reports(id) ON DELETE CASCADE,
  stage approval_stage_enum NOT NULL,
  action approval_action_enum NOT NULL,
  acted_by_user_id UUID NOT NULL REFERENCES users(id),
  acted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comments TEXT,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS motions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL,
  motion_number VARCHAR(50),
  text TEXT NOT NULL,
  moved_by_user_id UUID NOT NULL REFERENCES users(id),
  seconded_by_user_id UUID REFERENCES users(id),
  outcome VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  passed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motion_id UUID NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
  council_member_id UUID NOT NULL REFERENCES users(id),
  vote_value vote_value_enum NOT NULL,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_conflict_declared BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (motion_id, council_member_id)
);

CREATE TABLE IF NOT EXISTS minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  minute_taker_user_id UUID REFERENCES users(id),
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  started_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conflict_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by_user_id UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  changes_json JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(meeting_type_id);
CREATE INDEX IF NOT EXISTS idx_meetings_starts_at ON meetings(starts_at);
CREATE INDEX IF NOT EXISTS idx_agendas_status ON agendas(status);
CREATE INDEX IF NOT EXISTS idx_agenda_items_agenda ON agenda_items(agenda_id);
CREATE INDEX IF NOT EXISTS idx_staff_reports_author ON staff_reports(author_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_reports_workflow_status ON staff_reports(workflow_status);
CREATE INDEX IF NOT EXISTS idx_report_approvals_report ON report_approvals(staff_report_id);
CREATE INDEX IF NOT EXISTS idx_motions_meeting ON motions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_votes_motion ON votes(motion_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
