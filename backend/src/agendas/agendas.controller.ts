import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AgendasService } from './agendas.service';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { Public } from '../core/decorators/public.decorator';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { CreateAgendaItemDto } from './items/dto/create-agenda-item.dto';
import { UpdateAgendaItemDto } from './items/dto/update-agenda-item.dto';
import { ReorderAgendaItemsDto } from './items/dto/reorder-agenda-items.dto';
import { RejectAgendaDto } from './dto/reject-agenda.dto';
import { PaginationQueryDto } from '../types/pagination-query.dto';
import { BulkAgendaActionDto } from './dto/bulk-agenda-action.dto';

@Controller('agendas')
export class AgendasController {
  constructor(private readonly agendasService: AgendasService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.agendasService.health();
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post()
  create(@Body() dto: CreateAgendaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.agendasService.create(dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query('meetingId') meetingId?: string) {
    return this.agendasService.list(meetingId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('paged')
  listPaged(@Query() query: PaginationQueryDto & { meetingId?: string }) {
    return this.agendasService.listPaged({
      meetingId: query.meetingId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.agendasService.getById(id);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAgendaDto) {
    return this.agendasService.update(id, dto);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':id/items')
  addItem(
    @Param('id') id: string,
    @Body() dto: CreateAgendaItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendasService.addItem(id, dto, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Patch(':id/items/:itemId')
  updateItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateAgendaItemDto) {
    return this.agendasService.updateItem(id, itemId, dto);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':id/items/reorder')
  reorderItems(@Param('id') id: string, @Body() dto: ReorderAgendaItemsDto) {
    return this.agendasService.reorderItems(id, dto);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.agendasService.removeItem(id, itemId);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':id/submit-director')
  submitForDirector(@Param('id') id: string) {
    return this.agendasService.submitForDirector(id);
  }

  @Permissions(PERMISSIONS.REPORT_APPROVE_DIRECTOR)
  @Post(':id/approve-director')
  approveByDirector(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.agendasService.approveByDirector(id, user);
  }

  @Permissions(PERMISSIONS.REPORT_APPROVE_CAO)
  @Post(':id/approve-cao')
  approveByCao(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.agendasService.approveByCao(id, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectAgendaDto,
  ) {
    return this.agendasService.reject(id, user, dto);
  }

  @Permissions(PERMISSIONS.AGENDA_PUBLISH)
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.agendasService.publish(id);
  }

  @Permissions(PERMISSIONS.AGENDA_PUBLISH)
  @Post(':id/items/:itemId/publish')
  publishItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.agendasService.publishItem(id, itemId);
  }

  @Permissions(PERMISSIONS.AGENDA_PUBLISH)
  @Post(':id/items/:itemId/unpublish')
  unpublishItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.agendasService.unpublishItem(id, itemId);
  }

  @Permissions(PERMISSIONS.AGENDA_PUBLISH)
  @Post('scheduled/sweep')
  runScheduledSweep() {
    return this.agendasService.runScheduledPublicationSweep();
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post('bulk-action')
  runBulkAction(@Body() dto: BulkAgendaActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.agendasService.runBulkAction(dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id/version-history')
  versionHistory(@Param('id') id: string) {
    return this.agendasService.getVersionHistory(id);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':id/carry-forward/:targetAgendaId')
  carryForward(
    @Param('id') id: string,
    @Param('targetAgendaId') targetAgendaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agendasService.carryForwardItems(id, targetAgendaId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.agendasService.remove(id, user);
  }
}
