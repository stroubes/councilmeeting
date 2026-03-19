import type { AuthenticatedUser } from '../types/auth.types';

export const ADMIN_PORTAL_PERMISSIONS = [
  'users.manage',
  'roles.manage',
  'templates.manage',
  'notifications.manage',
  'api.settings.manage',
];

export function hasAdminPortalAccess(user: AuthenticatedUser | null): boolean {
  if (!user) {
    return false;
  }

  return ADMIN_PORTAL_PERMISSIONS.some((permission) => user.permissions.includes(permission));
}
