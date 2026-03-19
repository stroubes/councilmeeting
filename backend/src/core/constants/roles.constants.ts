export const SYSTEM_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  DIRECTOR: 'DIRECTOR',
  CAO: 'CAO',
  COUNCIL_MEMBER: 'COUNCIL_MEMBER',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
