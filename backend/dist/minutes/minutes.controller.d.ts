import { MinutesService } from './minutes.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMinutesDto } from './dto/create-minutes.dto';
import { UpdateMinutesDto } from './dto/update-minutes.dto';
export declare class MinutesController {
    private readonly minutesService;
    constructor(minutesService: MinutesService);
    health(): {
        status: string;
    };
    create(dto: CreateMinutesDto, user: AuthenticatedUser): Promise<import("./minutes.repository").MinutesRecord>;
    list(meetingId?: string): Promise<import("./minutes.repository").MinutesRecord[]>;
    getById(id: string): Promise<import("./minutes.repository").MinutesRecord>;
    update(id: string, dto: UpdateMinutesDto, user: AuthenticatedUser): Promise<import("./minutes.repository").MinutesRecord>;
    start(id: string, user: AuthenticatedUser): Promise<import("./minutes.repository").MinutesRecord>;
    finalize(id: string, user: AuthenticatedUser): Promise<import("./minutes.repository").MinutesRecord>;
    publish(id: string, user: AuthenticatedUser): Promise<import("./minutes.repository").MinutesRecord>;
}
