import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import type { MicrosoftTokenClaims } from './interfaces/microsoft-token-claims.interface';
import { ROLE_PERMISSION_MAP } from '../core/constants/rbac-map.constants';
import { SYSTEM_ROLES, type SystemRole } from '../core/constants/roles.constants';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async buildAuthenticatedUser(claims: MicrosoftTokenClaims): Promise<AuthenticatedUser> {
    const email = this.resolveEmail(claims);
    const managed = await this.usersService.findByOidOrEmail(claims.oid, email);
    const roles = managed?.roles?.length ? this.normalizeRoles(managed.roles) : this.resolveRoles(claims);
    const permissions = Array.from(
      new Set(roles.flatMap((role) => ROLE_PERMISSION_MAP[role] ?? [])),
    );

    return {
      id: claims.oid,
      microsoftOid: claims.oid,
      email,
      displayName: managed?.displayName ?? this.resolveDisplayName(claims, email),
      roles,
      permissions,
    };
  }

  buildBypassUser(input?: {
    oid?: string;
    email?: string;
    displayName?: string;
    roles?: string[];
    permissions?: string[];
  }): AuthenticatedUser {
    const roles = this.normalizeRoles(input?.roles);
    const defaultPermissions = roles.flatMap((role) => ROLE_PERMISSION_MAP[role] ?? []);
    const permissions = Array.from(new Set(input?.permissions?.length ? input.permissions : defaultPermissions));
    const email = input?.email?.trim().toLowerCase() || 'dev.user@municipality.local';
    const oid = input?.oid?.trim() || 'dev-bypass-user';

    return {
      id: oid,
      microsoftOid: oid,
      email,
      displayName: input?.displayName?.trim() || 'Local Dev User',
      roles,
      permissions,
    };
  }

  private resolveRoles(claims: MicrosoftTokenClaims): SystemRole[] {
    const fromClaims = Array.isArray(claims.roles)
      ? claims.roles
          .filter((role): role is string => typeof role === 'string')
          .map((role) => role.toUpperCase())
      : [];

    const validRoles = fromClaims.filter((role): role is SystemRole =>
      Object.values(SYSTEM_ROLES).includes(role as SystemRole),
    );

    if (validRoles.length > 0) {
      return validRoles;
    }

    return [SYSTEM_ROLES.STAFF];
  }

  private normalizeRoles(roles?: string[]): SystemRole[] {
    const normalized = (roles ?? [])
      .filter((role): role is string => typeof role === 'string')
      .map((role) => role.toUpperCase())
      .filter((role): role is SystemRole => Object.values(SYSTEM_ROLES).includes(role as SystemRole));

    if (normalized.length > 0) {
      return Array.from(new Set(normalized));
    }

    return [SYSTEM_ROLES.ADMIN];
  }

  private resolveEmail(claims: MicrosoftTokenClaims): string {
    const raw = claims.email ?? claims.preferred_username;
    if (typeof raw === 'string' && raw.length > 0) {
      return raw.toLowerCase();
    }
    return `${claims.oid}@local.invalid`;
  }

  private resolveDisplayName(claims: MicrosoftTokenClaims, fallback: string): string {
    if (typeof claims.name === 'string' && claims.name.length > 0) {
      return claims.name;
    }

    const givenName = typeof claims.given_name === 'string' ? claims.given_name : '';
    const familyName = typeof claims.family_name === 'string' ? claims.family_name : '';
    const combined = `${givenName} ${familyName}`.trim();
    if (combined.length > 0) {
      return combined;
    }

    return fallback;
  }
}
