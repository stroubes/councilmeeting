CREATE TABLE IF NOT EXISTS app_templates (
  id UUID PRIMARY KEY,
  template_type VARCHAR(50) NOT NULL,
  code VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS app_template_sections (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES app_templates(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  section_type VARCHAR(60),
  item_type VARCHAR(60),
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT uq_app_template_section_order UNIQUE (template_id, sort_order)
);

CREATE TABLE IF NOT EXISTS app_report_attachments (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(150),
  size_bytes BIGINT,
  source_type VARCHAR(40) NOT NULL,
  source_sharepoint_site_id VARCHAR(255),
  source_sharepoint_drive_id VARCHAR(255),
  source_sharepoint_item_id VARCHAR(255),
  source_sharepoint_web_url TEXT,
  uploaded_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_templates_type ON app_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_app_template_sections_template_id ON app_template_sections(template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_app_report_attachments_report_id ON app_report_attachments(report_id, created_at DESC);
