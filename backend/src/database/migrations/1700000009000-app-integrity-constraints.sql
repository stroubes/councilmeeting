-- Backfill cleanup for orphaned rows before adding foreign keys.
DELETE FROM app_agendas a
WHERE NOT EXISTS (SELECT 1 FROM app_meetings m WHERE m.id = a.meeting_id);

DELETE FROM app_agenda_items i
WHERE NOT EXISTS (SELECT 1 FROM app_agendas a WHERE a.id = i.agenda_id);

DELETE FROM app_staff_reports r
WHERE NOT EXISTS (SELECT 1 FROM app_agenda_items i WHERE i.id = r.agenda_item_id);

DELETE FROM app_report_approvals h
WHERE NOT EXISTS (SELECT 1 FROM app_staff_reports r WHERE r.id = h.staff_report_id);

DELETE FROM app_report_attachments a
WHERE NOT EXISTS (SELECT 1 FROM app_staff_reports r WHERE r.id = a.report_id);

DELETE FROM app_minutes m
WHERE NOT EXISTS (SELECT 1 FROM app_meetings mt WHERE mt.id = m.meeting_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_agendas_meeting') THEN
    ALTER TABLE app_agendas
      ADD CONSTRAINT fk_app_agendas_meeting
      FOREIGN KEY (meeting_id) REFERENCES app_meetings(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_agenda_items_agenda') THEN
    ALTER TABLE app_agenda_items
      ADD CONSTRAINT fk_app_agenda_items_agenda
      FOREIGN KEY (agenda_id) REFERENCES app_agendas(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_staff_reports_agenda_item') THEN
    ALTER TABLE app_staff_reports
      ADD CONSTRAINT fk_app_staff_reports_agenda_item
      FOREIGN KEY (agenda_item_id) REFERENCES app_agenda_items(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_report_approvals_report') THEN
    ALTER TABLE app_report_approvals
      ADD CONSTRAINT fk_app_report_approvals_report
      FOREIGN KEY (staff_report_id) REFERENCES app_staff_reports(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_report_attachments_report') THEN
    ALTER TABLE app_report_attachments
      ADD CONSTRAINT fk_app_report_attachments_report
      FOREIGN KEY (report_id) REFERENCES app_staff_reports(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_minutes_meeting') THEN
    ALTER TABLE app_minutes
      ADD CONSTRAINT fk_app_minutes_meeting
      FOREIGN KEY (meeting_id) REFERENCES app_meetings(id) ON DELETE CASCADE;
  END IF;
END $$;
