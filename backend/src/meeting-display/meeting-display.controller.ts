import { Body, Controller, Get, Param, Post, Query, Res, Sse, type MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import { Public } from '../core/decorators/public.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SetLiveAgendaItemDto } from './dto/set-live-agenda-item.dto';
import { SetLivePresentationDto } from './dto/set-live-presentation.dto';
import { SetPresentationSlideDto } from './dto/set-presentation-slide.dto';
import { MeetingDisplayService } from './meeting-display.service';

@Controller('meeting-display')
export class MeetingDisplayController {
  constructor(private readonly meetingDisplayService: MeetingDisplayService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.meetingDisplayService.health();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  getState(@Query('meetingId') meetingId: string) {
    return this.meetingDisplayService.getState(meetingId);
  }

  @Public()
  @Get('public/state')
  getPublicState(@Query('meetingId') meetingId: string) {
    return this.meetingDisplayService.getState(meetingId);
  }

  @Public()
  @Sse('public/stream')
  streamPublicState(@Query('meetingId') meetingId: string): Observable<MessageEvent> {
    return this.meetingDisplayService.streamPublicState(meetingId);
  }

  @Public()
  @Get('public/presentation-content')
  async getPublicPresentationContent(
    @Query('meetingId') meetingId: string,
    @Res() response: { setHeader: (name: string, value: string) => void; send: (body: Buffer) => void },
  ): Promise<void> {
    const content = await this.meetingDisplayService.getPublicPresentationContent(meetingId);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Disposition', `inline; filename="${content.fileName}"`);
    response.setHeader('X-Presentation-Slide-Number', String(content.slideNumber));
    response.send(content.buffer);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/set-agenda-item')
  setAgendaItem(
    @Param('meetingId') meetingId: string,
    @Body() dto: SetLiveAgendaItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingDisplayService.setAgendaItem(meetingId, dto.agendaItemId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/next')
  nextAgendaItem(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingDisplayService.nextAgendaItem(meetingId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/previous')
  previousAgendaItem(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingDisplayService.previousAgendaItem(meetingId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/show-agenda')
  showAgenda(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingDisplayService.showAgenda(meetingId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/show-motion')
  showMotion(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingDisplayService.showMotion(meetingId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/set-presentation')
  setPresentation(
    @Param('meetingId') meetingId: string,
    @Body() dto: SetLivePresentationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingDisplayService.setPresentation(meetingId, dto.presentationId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/presentation/next')
  nextPresentationSlide(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingDisplayService.nextPresentationSlide(meetingId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/presentation/previous')
  previousPresentationSlide(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingDisplayService.previousPresentationSlide(meetingId, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/presentation/set-slide')
  setPresentationSlide(
    @Param('meetingId') meetingId: string,
    @Body() dto: SetPresentationSlideDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.meetingDisplayService.setPresentationSlide(meetingId, dto.slideNumber, user);
  }

  @Permissions(PERMISSIONS.AGENDA_WRITE)
  @Post(':meetingId/show-presentation')
  showPresentation(@Param('meetingId') meetingId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.meetingDisplayService.showPresentation(meetingId, user);
  }
}
