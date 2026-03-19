import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { Public } from '../core/decorators/public.decorator';
import { UpsertUserDto } from './dto/upsert-user.dto';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.usersService.health();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Get()
  list() {
    return this.usersService.list();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Post()
  upsert(@Body() dto: UpsertUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.upsert(dto, user);
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Post(':id/roles')
  assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.assignRole(id, dto.roleCode, user);
  }
}
