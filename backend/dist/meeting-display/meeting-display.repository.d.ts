import { PostgresService } from '../database/postgres.service';
export type MeetingDisplayMode = 'AGENDA' | 'MOTION' | 'PRESENTATION';
export interface MeetingDisplayStateRecord {
    meetingId: string;
    displayMode: MeetingDisplayMode;
    currentAgendaItemId?: string;
    currentPresentationId?: string;
    currentPresentationSlideIndex?: number;
    updatedBy: string;
    updatedAt: string;
}
export declare class MeetingDisplayRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    getByMeetingId(meetingId: string): Promise<MeetingDisplayStateRecord | null>;
    upsert(meetingId: string, patch: Partial<Pick<MeetingDisplayStateRecord, 'displayMode'>> & {
        currentAgendaItemId?: string | null;
        currentPresentationId?: string | null;
        currentPresentationSlideIndex?: number | null;
    }, updatedBy: string): Promise<MeetingDisplayStateRecord>;
    private ensureSchema;
    private withFallback;
}
