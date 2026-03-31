import { BadRequestException, Injectable, type MessageEvent } from '@nestjs/common';
import { from, interval, map, Observable, startWith, switchMap, distinctUntilChanged } from 'rxjs';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AgendasService, type AgendaItemRecord, type AgendaRecord } from '../agendas/agendas.service';
import { AuditService } from '../audit/audit.service';
import { MeetingsService } from '../meetings/meetings.service';
import { MotionsService } from '../motions/motions.service';
import { PresentationsService } from '../presentations/presentations.service';
import type { PresentationSummary } from '../presentations/presentations.repository';
import {
  MeetingDisplayRepository,
  type MeetingDisplayMode,
  type MeetingDisplayStateRecord,
} from './meeting-display.repository';

export interface MeetingDisplayStateResponse {
  meetingId: string;
  displayMode: MeetingDisplayMode;
  agenda: {
    agendaId: string | null;
    currentItem: AgendaItemRecord | null;
    orderedItems: AgendaItemRecord[];
  };
  motion: {
    liveMotion: Awaited<ReturnType<MotionsService['getCurrentLive']>>;
    recentOutcomeMotion: Awaited<ReturnType<MotionsService['getPublicState']>>['recentOutcomeMotion'];
  };
  presentation: {
    currentPresentation: PresentationSummary | null;
    currentSlideIndex: number;
    currentSlideNumber: number;
    totalSlides: number;
    items: PresentationSummary[];
  };
  updatedAt: string;
}

@Injectable()
export class MeetingDisplayService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly agendasService: AgendasService,
    private readonly motionsService: MotionsService,
    private readonly presentationsService: PresentationsService,
    private readonly meetingDisplayRepository: MeetingDisplayRepository,
    private readonly auditService: AuditService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async getState(meetingId: string): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);
    const [resolvedAgenda, persistedState, motionPublicState, presentations] = await Promise.all([
      this.resolveAgendaContext(meetingId),
      this.meetingDisplayRepository.getByMeetingId(meetingId),
      this.motionsService.getPublicState(meetingId),
      this.presentationsService.list(meetingId),
    ]);

    const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, persistedState, 'system');
    const currentItem = this.findCurrentAgendaItem(state.currentAgendaItemId, resolvedAgenda.items);
    const currentPresentation = this.findCurrentPresentation(state.currentPresentationId, presentations);
    const totalSlides = currentPresentation?.pageCount ?? 0;
    const currentSlideIndex = currentPresentation
      ? this.normalizeSlideIndex(state.currentPresentationSlideIndex ?? 0, totalSlides)
      : 0;

    return {
      meetingId,
      displayMode: state.displayMode,
      agenda: {
        agendaId: resolvedAgenda.agenda?.id ?? null,
        currentItem,
        orderedItems: resolvedAgenda.items,
      },
      motion: {
        liveMotion: motionPublicState.liveMotion,
        recentOutcomeMotion: motionPublicState.recentOutcomeMotion,
      },
      presentation: {
        currentPresentation,
        currentSlideIndex,
        currentSlideNumber: totalSlides > 0 ? currentSlideIndex + 1 : 0,
        totalSlides,
        items: presentations,
      },
      updatedAt: state.updatedAt,
    };
  }

  async setAgendaItem(meetingId: string, agendaItemId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);
    const resolvedAgenda = await this.resolveAgendaContext(meetingId);
    const hasItem = resolvedAgenda.items.some((item) => item.id === agendaItemId);
    if (!hasItem) {
      throw new BadRequestException('Agenda item is not available for this meeting display');
    }

    await this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: 'AGENDA',
        currentAgendaItemId: agendaItemId,
      },
      user.id,
    );

    await this.auditService.log({
      actorUserId: user.id,
      action: 'meeting_display.set_agenda_item',
      entityType: 'meeting',
      entityId: meetingId,
      changesJson: { agendaItemId },
    });

    return this.getState(meetingId);
  }

  async nextAgendaItem(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    return this.stepAgendaItem(meetingId, user, 'next');
  }

  async previousAgendaItem(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    return this.stepAgendaItem(meetingId, user, 'previous');
  }

  async showAgenda(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);
    const [resolvedAgenda, presentations, existing] = await Promise.all([
      this.resolveAgendaContext(meetingId),
      this.presentationsService.list(meetingId),
      this.meetingDisplayRepository.getByMeetingId(meetingId),
    ]);
    const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);

    await this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: 'AGENDA',
        currentAgendaItemId: state.currentAgendaItemId,
      },
      user.id,
    );

    await this.auditService.log({
      actorUserId: user.id,
      action: 'meeting_display.show_agenda',
      entityType: 'meeting',
      entityId: meetingId,
    });

    return this.getState(meetingId);
  }

  async showMotion(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);

    await this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: 'MOTION',
      },
      user.id,
    );

    await this.auditService.log({
      actorUserId: user.id,
      action: 'meeting_display.show_motion',
      entityType: 'meeting',
      entityId: meetingId,
    });

    return this.getState(meetingId);
  }

  async showPresentation(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);
    const [resolvedAgenda, presentations, existing] = await Promise.all([
      this.resolveAgendaContext(meetingId),
      this.presentationsService.list(meetingId),
      this.meetingDisplayRepository.getByMeetingId(meetingId),
    ]);
    if (presentations.length === 0) {
      throw new BadRequestException('No presentations are available for this meeting display');
    }
    const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);
    const currentPresentationId = state.currentPresentationId ?? presentations[0].id;

    await this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: 'PRESENTATION',
        currentPresentationId,
        currentPresentationSlideIndex: state.currentPresentationSlideIndex ?? 0,
      },
      user.id,
    );

    await this.auditService.log({
      actorUserId: user.id,
      action: 'meeting_display.show_presentation',
      entityType: 'meeting',
      entityId: meetingId,
      changesJson: { presentationId: currentPresentationId },
    });

    return this.getState(meetingId);
  }

  async setPresentation(meetingId: string, presentationId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);
    const presentations = await this.presentationsService.list(meetingId);
    const target = presentations.find((presentation) => presentation.id === presentationId);
    if (!target) {
      throw new BadRequestException('Presentation is not available for this meeting display');
    }

    await this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: 'PRESENTATION',
        currentPresentationId: presentationId,
        currentPresentationSlideIndex: 0,
      },
      user.id,
    );

    await this.auditService.log({
      actorUserId: user.id,
      action: 'meeting_display.set_presentation',
      entityType: 'meeting',
      entityId: meetingId,
      changesJson: { presentationId },
    });

    return this.getState(meetingId);
  }

  async setPresentationSlide(
    meetingId: string,
    slideNumber: number,
    user: AuthenticatedUser,
  ): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);
    const [resolvedAgenda, presentations, existing] = await Promise.all([
      this.resolveAgendaContext(meetingId),
      this.presentationsService.list(meetingId),
      this.meetingDisplayRepository.getByMeetingId(meetingId),
    ]);
    const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);
    const currentPresentation = this.findCurrentPresentation(state.currentPresentationId, presentations);
    if (!currentPresentation) {
      throw new BadRequestException('No presentation is currently selected for this meeting display');
    }

    const requestedSlideIndex = slideNumber - 1;
    const nextSlideIndex = this.normalizeSlideIndex(requestedSlideIndex, currentPresentation.pageCount);

    await this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: 'PRESENTATION',
        currentPresentationId: currentPresentation.id,
        currentPresentationSlideIndex: nextSlideIndex,
      },
      user.id,
    );

    await this.auditService.log({
      actorUserId: user.id,
      action: 'meeting_display.set_presentation_slide',
      entityType: 'meeting',
      entityId: meetingId,
      changesJson: { presentationId: currentPresentation.id, slideNumber: nextSlideIndex + 1 },
    });

    return this.getState(meetingId);
  }

  async nextPresentationSlide(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    return this.stepPresentationSlide(meetingId, user, 'next');
  }

  async previousPresentationSlide(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse> {
    return this.stepPresentationSlide(meetingId, user, 'previous');
  }

  async getPublicPresentationContent(meetingId: string): Promise<{ buffer: Buffer; fileName: string; slideNumber: number }> {
    const state = await this.getState(meetingId);
    if (state.displayMode !== 'PRESENTATION' || !state.presentation.currentPresentation) {
      throw new BadRequestException('Presentation mode is not active for this meeting display');
    }

    const record = await this.presentationsService.getWithContentById(state.presentation.currentPresentation.id);
    return {
      buffer: Buffer.from(record.contentBase64, 'base64'),
      fileName: record.fileName,
      slideNumber: state.presentation.currentSlideNumber,
    };
  }

  private computeStateSignature(state: MeetingDisplayStateResponse): string {
    return JSON.stringify({
      displayMode: state.displayMode,
      agendaItemId: state.agenda.currentItem?.id ?? null,
      motionLiveId: state.motion.liveMotion?.id ?? null,
      motionOutcomeId: state.motion.recentOutcomeMotion?.id ?? null,
      presentationId: state.presentation.currentPresentation?.id ?? null,
      presentationSlideIndex: state.presentation.currentSlideIndex,
    });
  }

  streamPublicState(meetingId: string): Observable<MessageEvent> {
    return interval(1000).pipe(
      startWith(0),
      switchMap(() => from(this.getState(meetingId))),
      map((state) => ({
        state,
        signature: this.computeStateSignature(state),
      })),
      distinctUntilChanged((left, right) => left.signature === right.signature),
      map(({ state }) => ({
        type: 'meeting-display-state',
        data: state,
      })),
    );
  }

  private async stepAgendaItem(
    meetingId: string,
    user: AuthenticatedUser,
    direction: 'next' | 'previous',
  ): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);
    const [resolvedAgenda, presentations, existing] = await Promise.all([
      this.resolveAgendaContext(meetingId),
      this.presentationsService.list(meetingId),
      this.meetingDisplayRepository.getByMeetingId(meetingId),
    ]);
    if (resolvedAgenda.items.length === 0) {
      throw new BadRequestException('No agenda items are available for this meeting display');
    }

    const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);

    const currentIndex = resolvedAgenda.items.findIndex((item) => item.id === state.currentAgendaItemId);
    const normalizedCurrentIndex = currentIndex < 0 ? 0 : currentIndex;
    const step = direction === 'next' ? 1 : -1;
    const nextIndex =
      (normalizedCurrentIndex + step + resolvedAgenda.items.length) %
      resolvedAgenda.items.length;
    const nextItem = resolvedAgenda.items[nextIndex];

    await this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: 'AGENDA',
        currentAgendaItemId: nextItem.id,
      },
      user.id,
    );

    await this.auditService.log({
      actorUserId: user.id,
      action: direction === 'next' ? 'meeting_display.next' : 'meeting_display.previous',
      entityType: 'meeting',
      entityId: meetingId,
      changesJson: { agendaItemId: nextItem.id },
    });

    return this.getState(meetingId);
  }

  private async stepPresentationSlide(
    meetingId: string,
    user: AuthenticatedUser,
    direction: 'next' | 'previous',
  ): Promise<MeetingDisplayStateResponse> {
    await this.ensureMeetingExists(meetingId);
    const [resolvedAgenda, presentations, existing] = await Promise.all([
      this.resolveAgendaContext(meetingId),
      this.presentationsService.list(meetingId),
      this.meetingDisplayRepository.getByMeetingId(meetingId),
    ]);
    if (presentations.length === 0) {
      throw new BadRequestException('No presentations are available for this meeting display');
    }

    const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);
    const currentPresentation = this.findCurrentPresentation(state.currentPresentationId, presentations);
    if (!currentPresentation) {
      throw new BadRequestException('No presentation is currently selected for this meeting display');
    }

    const currentSlideIndex = this.normalizeSlideIndex(
      state.currentPresentationSlideIndex ?? 0,
      currentPresentation.pageCount,
    );
    const step = direction === 'next' ? 1 : -1;
    const nextSlideIndex =
      (currentSlideIndex + step + currentPresentation.pageCount) %
      currentPresentation.pageCount;

    await this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: 'PRESENTATION',
        currentPresentationId: currentPresentation.id,
        currentPresentationSlideIndex: nextSlideIndex,
      },
      user.id,
    );

    await this.auditService.log({
      actorUserId: user.id,
      action: direction === 'next' ? 'meeting_display.presentation_next' : 'meeting_display.presentation_previous',
      entityType: 'meeting',
      entityId: meetingId,
      changesJson: { presentationId: currentPresentation.id, slideNumber: nextSlideIndex + 1 },
    });

    return this.getState(meetingId);
  }

  private async ensureMeetingExists(meetingId: string): Promise<void> {
    const exists = await this.meetingsService.exists(meetingId);
    if (!exists) {
      throw new BadRequestException('Meeting does not exist for this display');
    }
  }

  private async resolveAgendaContext(
    meetingId: string,
  ): Promise<{ agenda: AgendaRecord | null; items: AgendaItemRecord[] }> {
    const agendas = await this.agendasService.list(meetingId);
    if (agendas.length === 0) {
      return { agenda: null, items: [] };
    }

    const publishedAgendas = agendas.filter((agenda) => agenda.status === 'PUBLISHED');
    const preferredAgenda =
      (publishedAgendas.length > 0 ? publishedAgendas : agendas)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] ?? null;

    if (!preferredAgenda) {
      return { agenda: null, items: [] };
    }

    return {
      agenda: preferredAgenda,
      items: [...preferredAgenda.items]
        .filter((item) => !item.isInCamera && item.itemType !== 'MOTION')
        .sort((left, right) => left.sortOrder - right.sortOrder),
    };
  }

  private async ensureValidState(
    meetingId: string,
    resolvedAgenda: { agenda: AgendaRecord | null; items: AgendaItemRecord[] },
    presentations: PresentationSummary[],
    state: MeetingDisplayStateRecord | null,
    actorUserId: string,
  ): Promise<MeetingDisplayStateRecord> {
    const defaultAgendaItemId = resolvedAgenda.items[0]?.id;
    const hasValidCurrentItem =
      Boolean(state?.currentAgendaItemId) &&
      resolvedAgenda.items.some((item) => item.id === state?.currentAgendaItemId);

    const hasValidCurrentPresentation =
      Boolean(state?.currentPresentationId) &&
      presentations.some((presentation) => presentation.id === state?.currentPresentationId);

    const activePresentation = presentations.find((presentation) => presentation.id === state?.currentPresentationId);
    const normalizedPresentationSlide = activePresentation
      ? this.normalizeSlideIndex(state?.currentPresentationSlideIndex ?? 0, activePresentation.pageCount)
      : undefined;

    const needsInit = !state;
    const needsAgendaPointerRepair = resolvedAgenda.items.length > 0 && !hasValidCurrentItem;
    const needsAgendaPointerClear = resolvedAgenda.items.length === 0 && Boolean(state?.currentAgendaItemId);
    const needsPresentationPointerRepair = presentations.length > 0 && !hasValidCurrentPresentation;
    const needsPresentationPointerClear = presentations.length === 0 && Boolean(state?.currentPresentationId);
    const needsSlideNormalization =
      Boolean(activePresentation) && normalizedPresentationSlide !== state?.currentPresentationSlideIndex;

    if (
      !needsInit &&
      !needsAgendaPointerRepair &&
      !needsAgendaPointerClear &&
      !needsPresentationPointerRepair &&
      !needsPresentationPointerClear &&
      !needsSlideNormalization
    ) {
      return state;
    }

    const defaultPresentationId = presentations[0]?.id;

    return this.meetingDisplayRepository.upsert(
      meetingId,
      {
        displayMode: state?.displayMode ?? 'AGENDA',
        currentAgendaItemId: needsAgendaPointerClear
          ? null
          : hasValidCurrentItem
            ? state?.currentAgendaItemId
            : defaultAgendaItemId,
        currentPresentationId: needsPresentationPointerClear
          ? null
          : hasValidCurrentPresentation
            ? state?.currentPresentationId
            : defaultPresentationId,
        currentPresentationSlideIndex: needsPresentationPointerClear
          ? null
          : hasValidCurrentPresentation
            ? normalizedPresentationSlide ?? 0
            : 0,
      },
      actorUserId,
    );
  }

  private findCurrentAgendaItem(
    currentAgendaItemId: string | undefined,
    items: AgendaItemRecord[],
  ): AgendaItemRecord | null {
    if (items.length === 0) {
      return null;
    }
    if (!currentAgendaItemId) {
      return items[0];
    }
    return items.find((item) => item.id === currentAgendaItemId) ?? items[0];
  }

  private findCurrentPresentation(
    currentPresentationId: string | undefined,
    items: PresentationSummary[],
  ): PresentationSummary | null {
    if (items.length === 0) {
      return null;
    }
    if (!currentPresentationId) {
      return items[0];
    }
    return items.find((item) => item.id === currentPresentationId) ?? items[0];
  }

  private normalizeSlideIndex(index: number, pageCount: number): number {
    if (pageCount <= 0) {
      return 0;
    }
    if (index < 0) {
      return 0;
    }
    if (index >= pageCount) {
      return pageCount - 1;
    }
    return index;
  }
}
