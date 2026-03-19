import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { PresentationsService } from './presentations.service';
export declare class PresentationsController {
    private readonly presentationsService;
    constructor(presentationsService: PresentationsService);
    health(): {
        status: string;
    };
    list(meetingId?: string): Promise<import("./presentations.repository").PresentationSummary[]>;
    getById(id: string): Promise<import("./presentations.repository").PresentationSummary>;
    create(dto: CreatePresentationDto, user: AuthenticatedUser): Promise<import("./presentations.repository").PresentationSummary>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
}
