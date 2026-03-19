import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { MeetingsService } from '../meetings/meetings.service';
import type { CreateMotionDto } from './dto/create-motion.dto';
import type { SetMotionOutcomeDto } from './dto/set-motion-outcome.dto';
import type { UpdateMotionDto } from './dto/update-motion.dto';
import { type MotionRecord, MotionsRepository } from './motions.repository';
export declare class MotionsService {
    private readonly meetingsService;
    private readonly motionsRepository;
    private readonly auditService;
    constructor(meetingsService: MeetingsService, motionsRepository: MotionsRepository, auditService: AuditService);
    health(): {
        status: string;
    };
    list(meetingId?: string): Promise<MotionRecord[]>;
    getById(id: string): Promise<MotionRecord>;
    create(dto: CreateMotionDto, user: AuthenticatedUser): Promise<MotionRecord>;
    update(id: string, dto: UpdateMotionDto, user: AuthenticatedUser): Promise<MotionRecord>;
    setLive(id: string, user: AuthenticatedUser): Promise<MotionRecord>;
    setOutcome(id: string, dto: SetMotionOutcomeDto, user: AuthenticatedUser): Promise<MotionRecord>;
    getCurrentLive(meetingId: string): Promise<MotionRecord | null>;
    getPublicState(meetingId: string): Promise<{
        liveMotion: MotionRecord | null;
        recentOutcomeMotion: MotionRecord | null;
    }>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
}
