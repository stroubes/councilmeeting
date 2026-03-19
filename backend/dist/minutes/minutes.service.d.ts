import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MeetingsService } from '../meetings/meetings.service';
import { AuditService } from '../audit/audit.service';
import { type MinutesRecord, MinutesRepository } from './minutes.repository';
import type { CreateMinutesDto } from './dto/create-minutes.dto';
import type { UpdateMinutesDto } from './dto/update-minutes.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class MinutesService {
    private readonly meetingsService;
    private readonly minutesRepository;
    private readonly auditService;
    private readonly notificationsService;
    constructor(meetingsService: MeetingsService, minutesRepository: MinutesRepository, auditService: AuditService, notificationsService: NotificationsService);
    health(): {
        status: string;
    };
    create(dto: CreateMinutesDto, user: AuthenticatedUser): Promise<MinutesRecord>;
    list(meetingId?: string): Promise<MinutesRecord[]>;
    getById(id: string): Promise<MinutesRecord>;
    start(id: string, user: AuthenticatedUser): Promise<MinutesRecord>;
    update(id: string, dto: UpdateMinutesDto, user: AuthenticatedUser): Promise<MinutesRecord>;
    finalize(id: string, user: AuthenticatedUser): Promise<MinutesRecord>;
    publish(id: string, user: AuthenticatedUser): Promise<MinutesRecord>;
    private emitNotification;
}
