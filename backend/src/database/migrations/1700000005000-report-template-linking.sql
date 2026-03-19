ALTER TABLE app_staff_reports
  ADD COLUMN IF NOT EXISTS template_id UUID;

CREATE INDEX IF NOT EXISTS idx_app_staff_reports_template_id
  ON app_staff_reports(template_id);
