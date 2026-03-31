import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { ActionsService } from './actions.service';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query('status') status?: string, @Query('ownerUserId') ownerUserId?: string) {
    return this.actionsService.list({ status, ownerUserId });
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('dashboard')
  dashboard() {
    return this.actionsService.dashboard();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.actionsService.getById(id);
  }

  @Permissions(PERMISSIONS.ACTION_MANAGE)
  @Post()
  create(@Body() dto: CreateActionItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.actionsService.create(dto, user);
  }

  @Permissions(PERMISSIONS.ACTION_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateActionItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.actionsService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.ACTION_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.actionsService.remove(id, user);
  }
}
