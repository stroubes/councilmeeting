import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { Public } from '../core/decorators/public.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { InCameraAccessGuard } from '../core/guards/in-camera-access.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingListQueryDto } from './dto/meeting-list-query.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.meetingsService.health();
  }

  @Public()
  @Get('public')
  listPublic() {
    return this.meetingsService.listPublic();
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Post()
  create(@Body() dto: CreateMeetingDto, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.create(dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query() query: MeetingQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.list(query, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('paged')
  listPaged(@Query() query: MeetingListQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.listPaged(query, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @UseGuards(InCameraAccessGuard)
  @Get('access-check')
  accessCheck(@Query('inCamera') inCamera?: string): { inCamera: boolean; allowed: boolean } {
    return { inCamera: inCamera === 'true' || inCamera === '1', allowed: true };
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.getById(id, user);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingsService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingsService.remove(id);
  }

  @Permissions(PERMISSIONS.MEETING_START)
  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.startMeeting(id, user);
  }

  @Permissions(PERMISSIONS.MEETING_END)
  @Post(':id/end')
  end(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('endStatus') endStatus?: 'ADJOURNED' | 'COMPLETED',
  ) {
    return this.meetingsService.endMeeting(id, user, endStatus ?? 'ADJOURNED');
  }

  @Permissions(PERMISSIONS.MEETING_PUBLISH)
  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.publishMeeting(id, user);
  }

  @Permissions(PERMISSIONS.MEETING_PUBLISH)
  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.archiveMeeting(id, user);
  }
}
