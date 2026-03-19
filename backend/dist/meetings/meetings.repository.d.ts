import { PostgresService } from '../database/postgres.service';
import type { MeetingListQueryDto } from './dto/meeting-list-query.dto';
import type { MeetingQueryDto } from './dto/meeting-query.dto';
import type { MeetingPageResult, MeetingRecord, MeetingStatus } from './meetings.service';
interface CreateMeetingInput {
    title: string;
    description?: string;
    meetingTypeCode: string;
    startsAt: string;
    endsAt?: string;
    location?: string;
    status: MeetingStatus;
    isPublic: boolean;
    isInCamera: boolean;
    videoUrl?: string;
    recurrenceGroupId?: string;
    recurrenceIndex?: number;
    createdBy: string;
}
export declare class MeetingsRepository {
    private readonly postgresService;
    private readonly memoryMeetings;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    create(input: CreateMeetingInput): Promise<MeetingRecord>;
    list(query: MeetingQueryDto): Promise<MeetingRecord[]>;
    listPaged(query: MeetingListQueryDto): Promise<MeetingPageResult>;
    listPublic(): Promise<MeetingRecord[]>;
    getById(id: string): Promise<MeetingRecord>;
    update(id: string, patch: Partial<MeetingRecord>): Promise<MeetingRecord>;
    exists(id: string): Promise<boolean>;
    remove(id: string): Promise<void>;
    private ensureSchema;
    private withFallback;
    private createInMemory;
    private listInMemory;
    private listPagedInMemory;
    private buildWhereClause;
    private resolveSortClause;
    private resolveSort;
    private normalizePagination;
    private filterInMemory;
    private compareMeetings;
}
export {};
