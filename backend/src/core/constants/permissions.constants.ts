export const PERMISSIONS = {
  MEETING_READ: 'meeting.read',
  MEETING_READ_IN_CAMERA: 'meeting.read.in_camera',
  BYLAW_READ: 'bylaw.read',
  BYLAW_WRITE: 'bylaw.write',
  MEETING_WRITE: 'meeting.write',
  AGENDA_WRITE: 'agenda.write',
  AGENDA_PUBLISH: 'agenda.publish',
  REPORT_SUBMIT: 'report.submit',
  REPORT_APPROVE_DIRECTOR: 'report.approve.director',
  REPORT_APPROVE_CAO: 'report.approve.cao',
  TEMPLATES_MANAGE: 'templates.manage',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  MINUTES_WRITE: 'minutes.write',
  MINUTES_ADOPT: 'minutes.adopt',
  MINUTES_PUBLISH: 'minutes.publish',
  VOTE_RECORD: 'vote.record',
  PUBLIC_PUBLISH: 'public.publish',
  RESOLUTION_MANAGE: 'resolution.manage',
  ACTION_MANAGE: 'action.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
