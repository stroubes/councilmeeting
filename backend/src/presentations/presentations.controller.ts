import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { Public } from '../core/decorators/public.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { PresentationsService } from './presentations.service';

@Controller('presentations')
export class PresentationsController {
  constructor(private readonly presentationsService: PresentationsService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.presentationsService.health();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query('meetingId') meetingId?: string) {
    return this.presentationsService.list(meetingId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.presentationsService.getById(id);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post()
  create(@Body() dto: CreatePresentationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.presentationsService.create(dto, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.presentationsService.remove(id, user);
  }
}
