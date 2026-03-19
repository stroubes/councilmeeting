import { PostgresService } from '../database/postgres.service';
export type MotionStatus = 'DRAFT' | 'LIVE' | 'CARRIED' | 'DEFEATED' | 'WITHDRAWN';
export interface MotionRecord {
    id: string;
    meetingId: string;
    agendaItemId?: string;
    sortOrder: number;
    title: string;
    body: string;
    status: MotionStatus;
    isCurrentLive: boolean;
    resultNote?: string;
    liveAt?: string;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}
interface CreateMotionInput {
    meetingId: string;
    agendaItemId?: string;
    title: string;
    body: string;
    createdBy: string;
}
export declare class MotionsRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    list(meetingId?: string): Promise<MotionRecord[]>;
    getById(id: string): Promise<MotionRecord>;
    create(input: CreateMotionInput): Promise<MotionRecord>;
    update(id: string, patch: Partial<Pick<MotionRecord, 'agendaItemId' | 'title' | 'body' | 'status' | 'isCurrentLive' | 'resultNote' | 'liveAt' | 'updatedBy'>>): Promise<MotionRecord>;
    clearLiveByMeeting(meetingId: string, updatedBy: string): Promise<void>;
    getCurrentLiveByMeeting(meetingId: string): Promise<MotionRecord | null>;
    remove(id: string): Promise<void>;
    private getNextSortOrder;
    private ensureSchema;
    private withFallback;
}
export {};
