import { Injectable } from '@nestjs/common';
import { ROLE_PERMISSION_MAP } from '../core/constants/rbac-map.constants';
import { SYSTEM_ROLES } from '../core/constants/roles.constants';

@Injectable()
export class RolesService {
  health(): { status: string } {
    return { status: 'ok' };
  }

  list() {
    return Object.values(SYSTEM_ROLES).map((code) => ({
      code,
      permissions: ROLE_PERMISSION_MAP[code] ?? [],
    }));
  }
}
