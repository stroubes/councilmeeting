import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Public } from '../core/decorators/public.decorator';
import { CreateMeetingTypeDto } from './dto/create-meeting-type.dto';
import { MeetingTypesService } from './meeting-types.service';

@Controller('meeting-types')
export class MeetingTypesController {
  constructor(private readonly meetingTypesService: MeetingTypesService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.meetingTypesService.health();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query('includeInactive') includeInactive?: string) {
    return this.meetingTypesService.list(includeInactive === 'true' || includeInactive === '1');
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Post()
  create(@Body() dto: CreateMeetingTypeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingTypesService.create(dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingTypesService.remove(id);
  }
}
