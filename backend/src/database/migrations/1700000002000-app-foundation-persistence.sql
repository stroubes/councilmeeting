CREATE TABLE IF NOT EXISTS app_meetings (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  meeting_type_code VARCHAR(100) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  is_public BOOLEAN NOT NULL,
  is_in_camera BOOLEAN NOT NULL,
  video_url TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT chk_app_meeting_time CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS app_agendas (
  id UUID PRIMARY KEY,
  meeting_id UUID NOT NULL,
  template_id VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS app_agenda_items (
  id UUID PRIMARY KEY,
  agenda_id UUID NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  parent_item_id UUID,
  is_in_camera BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS app_staff_reports (
  id UUID PRIMARY KEY,
  agenda_item_id UUID NOT NULL,
  report_number VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  author_user_id VARCHAR(255) NOT NULL,
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
  parsing_version VARCHAR(50) NOT NULL,
  parsing_warnings_json JSONB,
  workflow_status VARCHAR(50) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS app_report_approvals (
  id UUID PRIMARY KEY,
  staff_report_id UUID NOT NULL,
  stage VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  acted_by_user_id VARCHAR(255) NOT NULL,
  acted_at TIMESTAMPTZ NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_meetings_starts_at ON app_meetings(starts_at);
CREATE INDEX IF NOT EXISTS idx_app_agendas_meeting_id ON app_agendas(meeting_id);
CREATE INDEX IF NOT EXISTS idx_app_agenda_items_agenda_id ON app_agenda_items(agenda_id);
CREATE INDEX IF NOT EXISTS idx_app_staff_reports_status ON app_staff_reports(workflow_status);
CREATE INDEX IF NOT EXISTS idx_app_report_approvals_report_id ON app_report_approvals(staff_report_id);
