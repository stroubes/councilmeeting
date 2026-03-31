import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { CreateResolutionDto } from './dto/create-resolution.dto';
import { UpdateResolutionDto } from './dto/update-resolution.dto';
import { ResolutionsService } from './resolutions.service';

@Controller('resolutions')
export class ResolutionsController {
  constructor(private readonly resolutionsService: ResolutionsService) {}

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query('meetingId') meetingId?: string) {
    return this.resolutionsService.list(meetingId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('meeting/:meetingId/export-sheet')
  exportSheet(@Param('meetingId') meetingId: string) {
    return this.resolutionsService.exportPacket(meetingId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.resolutionsService.getById(id);
  }

  @Permissions(PERMISSIONS.RESOLUTION_MANAGE)
  @Post()
  create(@Body() dto: CreateResolutionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.resolutionsService.create(dto, user);
  }

  @Permissions(PERMISSIONS.RESOLUTION_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateResolutionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.resolutionsService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.RESOLUTION_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.resolutionsService.remove(id, user);
  }

}
