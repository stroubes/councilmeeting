-- Backfill report workflow configuration and stage pointer metadata.
WITH default_workflow AS (
  SELECT id
  FROM app_workflows
  WHERE domain = 'REPORT' AND is_default = TRUE
  ORDER BY updated_at DESC
  LIMIT 1
)
UPDATE app_staff_reports
SET workflow_config_id = COALESCE(workflow_config_id, (SELECT id FROM default_workflow))
WHERE workflow_config_id IS NULL;

UPDATE app_staff_reports
SET current_workflow_stage_index = 1,
    current_workflow_stage_key = COALESCE(current_workflow_stage_key, 'INITIAL_REVIEW')
WHERE workflow_status = 'PENDING_WORKFLOW_APPROVAL'
  AND current_workflow_stage_index IS NULL;

-- Backfill agenda publish metadata defaults for legacy rows.
UPDATE app_agenda_items
SET is_public_visible = CASE WHEN is_in_camera THEN FALSE ELSE TRUE END
WHERE is_public_visible IS NULL;

UPDATE app_agenda_items
SET carry_forward_to_next = FALSE
WHERE carry_forward_to_next IS NULL;
