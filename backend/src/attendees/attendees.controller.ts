import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateAttendeeDto } from './dto/create-attendee.dto';
import { UpdateAttendeeDto } from './dto/update-attendee.dto';
import { AttendeesService } from './attendees.service';

@Controller('attendees')
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('meeting/:meetingId')
  listByMeeting(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendeesService.listByMeeting(meetingId, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('meeting/:meetingId/quorum')
  getQuorumStatus(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendeesService.getQuorumStatus(meetingId, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.attendeesService.getById(id);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Post()
  create(@Body() dto: CreateAttendeeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.attendeesService.create(dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttendeeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.attendeesService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendeesService.remove(id, user);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Post('meeting/:meetingId/arrival/:userId')
  recordArrival(
    @Param('meetingId') meetingId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.recordArrival(meetingId, targetUserId, user);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Post('meeting/:meetingId/departure/:userId')
  recordDeparture(
    @Param('meetingId') meetingId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.recordDeparture(meetingId, targetUserId, user);
  }
}