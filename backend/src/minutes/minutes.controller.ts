import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MinutesService } from './minutes.service';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMinutesDto } from './dto/create-minutes.dto';
import { UpdateMinutesDto } from './dto/update-minutes.dto';
import { Public } from '../core/decorators/public.decorator';

@Controller('minutes')
export class MinutesController {
  constructor(private readonly minutesService: MinutesService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.minutesService.health();
  }

  @Permissions(PERMISSIONS.MINUTES_WRITE)
  @Post()
  create(@Body() dto: CreateMinutesDto, @CurrentUser() user: AuthenticatedUser) {
    return this.minutesService.create(dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query('meetingId') meetingId?: string) {
    return this.minutesService.list(meetingId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.minutesService.getById(id);
  }

  @Permissions(PERMISSIONS.MINUTES_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMinutesDto, @CurrentUser() user: AuthenticatedUser) {
    return this.minutesService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.MINUTES_WRITE)
  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.minutesService.start(id, user);
  }

  @Permissions(PERMISSIONS.MINUTES_WRITE)
  @Post(':id/finalize')
  finalize(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.minutesService.finalize(id, user);
  }

  @Permissions(PERMISSIONS.MINUTES_PUBLISH)
  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.minutesService.publish(id, user);
  }
}
