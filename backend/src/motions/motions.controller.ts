import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '../core/decorators/public.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMotionDto } from './dto/create-motion.dto';
import { SetMotionOutcomeDto } from './dto/set-motion-outcome.dto';
import { UpdateMotionDto } from './dto/update-motion.dto';
import { MotionsService } from './motions.service';

@Controller('motions')
export class MotionsController {
  constructor(private readonly motionsService: MotionsService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.motionsService.health();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query('meetingId') meetingId?: string) {
    return this.motionsService.list(meetingId);
  }

  @Public()
  @Get('public/live')
  getCurrentLive(@Query('meetingId') meetingId: string) {
    return this.motionsService.getCurrentLive(meetingId);
  }

  @Public()
  @Get('public/state')
  getPublicState(@Query('meetingId') meetingId: string) {
    return this.motionsService.getPublicState(meetingId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.motionsService.getById(id);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post()
  create(@Body() dto: CreateMotionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.motionsService.create(dto, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMotionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.motionsService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':id/set-live')
  setLive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.motionsService.setLive(id, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':id/set-outcome')
  setOutcome(@Param('id') id: string, @Body() dto: SetMotionOutcomeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.motionsService.setOutcome(id, dto, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.motionsService.remove(id, user);
  }
}
