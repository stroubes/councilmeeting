import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMeetingTypeDto } from './dto/create-meeting-type.dto';
import { MeetingTypesService } from './meeting-types.service';
export declare class MeetingTypesController {
    private readonly meetingTypesService;
    constructor(meetingTypesService: MeetingTypesService);
    health(): {
        status: string;
    };
    list(includeInactive?: string): Promise<import("./meeting-types.repository").MeetingTypeRecord[]>;
    create(dto: CreateMeetingTypeDto, user: AuthenticatedUser): Promise<import("./meeting-types.repository").MeetingTypeRecord>;
    remove(id: string): Promise<{
        ok: true;
    }>;
}
