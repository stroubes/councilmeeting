import { type MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AgendasService, type AgendaItemRecord } from '../agendas/agendas.service';
import { AuditService } from '../audit/audit.service';
import { MeetingsService } from '../meetings/meetings.service';
import { MotionsService } from '../motions/motions.service';
import { PresentationsService } from '../presentations/presentations.service';
import type { PresentationSummary } from '../presentations/presentations.repository';
import { MeetingDisplayRepository, type MeetingDisplayMode } from './meeting-display.repository';
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
export declare class MeetingDisplayService {
    private readonly meetingsService;
    private readonly agendasService;
    private readonly motionsService;
    private readonly presentationsService;
    private readonly meetingDisplayRepository;
    private readonly auditService;
    constructor(meetingsService: MeetingsService, agendasService: AgendasService, motionsService: MotionsService, presentationsService: PresentationsService, meetingDisplayRepository: MeetingDisplayRepository, auditService: AuditService);
    health(): {
        status: string;
    };
    getState(meetingId: string): Promise<MeetingDisplayStateResponse>;
    setAgendaItem(meetingId: string, agendaItemId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    nextAgendaItem(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    previousAgendaItem(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    showAgenda(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    showMotion(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    showPresentation(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    setPresentation(meetingId: string, presentationId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    setPresentationSlide(meetingId: string, slideNumber: number, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    nextPresentationSlide(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    previousPresentationSlide(meetingId: string, user: AuthenticatedUser): Promise<MeetingDisplayStateResponse>;
    getPublicPresentationContent(meetingId: string): Promise<{
        buffer: Buffer;
        fileName: string;
        slideNumber: number;
    }>;
    streamPublicState(meetingId: string): Observable<MessageEvent>;
    private stepAgendaItem;
    private stepPresentationSlide;
    private ensureMeetingExists;
    private resolveAgendaContext;
    private ensureValidState;
    private findCurrentAgendaItem;
    private findCurrentPresentation;
    private normalizeSlideIndex;
}
