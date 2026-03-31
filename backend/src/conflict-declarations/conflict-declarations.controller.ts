import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateConflictDeclarationDto } from './dto/create-conflict-declaration.dto';
import { UpdateConflictDeclarationDto } from './dto/update-conflict-declaration.dto';
import { ConflictDeclarationsService } from './conflict-declarations.service';

@Controller('conflict-declarations')
export class ConflictDeclarationsController {
  constructor(private readonly conflictDeclarationsService: ConflictDeclarationsService) {}

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Post()
  create(@Body() dto: CreateConflictDeclarationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.conflictDeclarationsService.create(dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('meeting/:meetingId')
  listByMeeting(@Param('meetingId') meetingId: string) {
    return this.conflictDeclarationsService.listByMeeting(meetingId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('agenda-item/:agendaItemId')
  listByAgendaItem(@Param('agendaItemId') agendaItemId: string) {
    return this.conflictDeclarationsService.listByAgendaItem(agendaItemId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.conflictDeclarationsService.getById(id);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConflictDeclarationDto) {
    return this.conflictDeclarationsService.update(id, dto);
  }

  @Permissions(PERMISSIONS.MEETING_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conflictDeclarationsService.remove(id);
  }
}