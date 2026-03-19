import { MeetingsService } from './meetings.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingListQueryDto } from './dto/meeting-list-query.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
export declare class MeetingsController {
    private readonly meetingsService;
    constructor(meetingsService: MeetingsService);
    health(): {
        status: string;
    };
    listPublic(): Promise<import("./meetings.service").MeetingRecord[]>;
    create(dto: CreateMeetingDto, user: AuthenticatedUser): Promise<import("./meetings.service").MeetingRecord>;
    list(query: MeetingQueryDto, user: AuthenticatedUser): Promise<import("./meetings.service").MeetingRecord[]>;
    listPaged(query: MeetingListQueryDto, user: AuthenticatedUser): Promise<import("./meetings.service").MeetingPageResult>;
    accessCheck(inCamera?: string): {
        inCamera: boolean;
        allowed: boolean;
    };
    getById(id: string, user: AuthenticatedUser): Promise<import("./meetings.service").MeetingRecord>;
    update(id: string, dto: UpdateMeetingDto, user: AuthenticatedUser): Promise<import("./meetings.service").MeetingRecord>;
    remove(id: string): Promise<{
        ok: true;
    }>;
}
