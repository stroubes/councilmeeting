import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { MeetingsService } from '../meetings/meetings.service';
import type { CreatePresentationDto } from './dto/create-presentation.dto';
import { type PresentationRecord, type PresentationSummary, PresentationsRepository } from './presentations.repository';
export declare class PresentationsService {
    private readonly meetingsService;
    private readonly presentationsRepository;
    private readonly auditService;
    constructor(meetingsService: MeetingsService, presentationsRepository: PresentationsRepository, auditService: AuditService);
    health(): {
        status: string;
    };
    list(meetingId?: string): Promise<PresentationSummary[]>;
    getById(id: string): Promise<PresentationSummary>;
    getWithContentById(id: string): Promise<PresentationRecord>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
    create(dto: CreatePresentationDto, user: AuthenticatedUser): Promise<PresentationSummary>;
    private convertPowerPointToPdf;
    private countPdfPages;
}
