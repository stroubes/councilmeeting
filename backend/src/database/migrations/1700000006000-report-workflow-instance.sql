ALTER TABLE app_staff_reports
  ADD COLUMN IF NOT EXISTS workflow_config_id UUID,
  ADD COLUMN IF NOT EXISTS current_workflow_stage_index INTEGER,
  ADD COLUMN IF NOT EXISTS current_workflow_stage_key VARCHAR(120),
  ADD COLUMN IF NOT EXISTS current_workflow_approver_role VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_app_staff_reports_workflow_config
  ON app_staff_reports(workflow_config_id);

CREATE INDEX IF NOT EXISTS idx_app_staff_reports_current_workflow_role
  ON app_staff_reports(current_workflow_approver_role);
