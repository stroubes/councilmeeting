import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Public } from '../core/decorators/public.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.rolesService.health();
  }

  @Permissions(PERMISSIONS.ROLES_MANAGE)
  @Get()
  list() {
    return this.rolesService.list();
  }
}
