import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import type { CreateMeetingTypeDto } from './dto/create-meeting-type.dto';
import { MeetingTypesRepository, type MeetingTypeRecord } from './meeting-types.repository';
export declare class MeetingTypesService {
    private readonly meetingTypesRepository;
    constructor(meetingTypesRepository: MeetingTypesRepository);
    health(): {
        status: string;
    };
    list(includeInactive: boolean): Promise<MeetingTypeRecord[]>;
    create(dto: CreateMeetingTypeDto, user: AuthenticatedUser): Promise<MeetingTypeRecord>;
    getByCode(code: string): Promise<MeetingTypeRecord>;
    remove(id: string): Promise<{
        ok: true;
    }>;
}
