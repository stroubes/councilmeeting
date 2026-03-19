import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import type { CreateMeetingDto } from './dto/create-meeting.dto';
import type { MeetingListQueryDto } from './dto/meeting-list-query.dto';
import type { MeetingQueryDto } from './dto/meeting-query.dto';
import type { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingsRepository } from './meetings.repository';
import { MeetingTypesService } from '../meeting-types/meeting-types.service';
export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ADJOURNED' | 'CANCELLED' | 'COMPLETED';
export interface MeetingRecord {
    id: string;
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
    createdAt: string;
    updatedAt: string;
}
export interface MeetingPageResult {
    items: MeetingRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export declare class MeetingsService {
    private readonly meetingsRepository;
    private readonly meetingTypesService;
    constructor(meetingsRepository: MeetingsRepository, meetingTypesService: MeetingTypesService);
    health(): {
        status: string;
    };
    create(dto: CreateMeetingDto, user: AuthenticatedUser): Promise<MeetingRecord>;
    list(query: MeetingQueryDto, user: AuthenticatedUser): Promise<MeetingRecord[]>;
    listPaged(query: MeetingListQueryDto, user: AuthenticatedUser): Promise<MeetingPageResult>;
    listPublic(): Promise<MeetingRecord[]>;
    getById(id: string, user: AuthenticatedUser): Promise<MeetingRecord>;
    update(id: string, dto: UpdateMeetingDto, user: AuthenticatedUser): Promise<MeetingRecord>;
    exists(id: string): Promise<boolean>;
    remove(id: string): Promise<{
        ok: true;
    }>;
    private applyInCameraAccess;
}
