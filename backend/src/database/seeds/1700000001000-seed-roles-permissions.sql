INSERT INTO roles (code, name, description, is_system_role)
VALUES
  ('ADMIN', 'Administrator', 'System administrator', TRUE),
  ('STAFF', 'Staff', 'Municipal staff member', TRUE),
  ('DIRECTOR', 'Director', 'Department director approver', TRUE),
  ('CAO', 'CAO', 'Chief Administrative Officer', TRUE),
  ('COUNCIL_MEMBER', 'Council Member', 'Voting council member', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, name, module, description)
VALUES
  ('meeting.read', 'Read meetings', 'meetings', 'Read meeting records'),
  ('meeting.read.in_camera', 'Read in-camera meetings', 'meetings', 'Read restricted in-camera meetings'),
  ('meeting.write', 'Manage meetings', 'meetings', 'Create and update meetings'),
  ('agenda.write', 'Manage agenda', 'agendas', 'Create and edit agenda and items'),
  ('agenda.publish', 'Publish agenda', 'agendas', 'Publish approved agenda package'),
  ('report.submit', 'Submit report', 'reports', 'Submit staff report for approval'),
  ('report.approve.director', 'Approve report (Director)', 'workflows', 'Director-level report approval'),
  ('report.approve.cao', 'Approve report (CAO)', 'workflows', 'CAO-level report approval'),
  ('templates.manage', 'Manage templates', 'admin', 'Create and maintain agenda and staff-report templates'),
  ('users.manage', 'Manage users', 'admin', 'Manage local user role assignments'),
  ('roles.manage', 'Manage roles', 'admin', 'View and manage role configuration'),
  ('minutes.write', 'Take minutes', 'minutes', 'Record live minutes and motions'),
  ('minutes.publish', 'Publish minutes', 'minutes', 'Publish finalized minutes'),
  ('vote.record', 'Record votes', 'minutes', 'Record council member votes'),
  ('public.publish', 'Publish to public portal', 'public', 'Publish agenda/minutes to public portal')
ON CONFLICT (code) DO NOTHING;
