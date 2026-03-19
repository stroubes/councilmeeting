import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMotionDto } from './dto/create-motion.dto';
import { SetMotionOutcomeDto } from './dto/set-motion-outcome.dto';
import { UpdateMotionDto } from './dto/update-motion.dto';
import { MotionsService } from './motions.service';
export declare class MotionsController {
    private readonly motionsService;
    constructor(motionsService: MotionsService);
    health(): {
        status: string;
    };
    list(meetingId?: string): Promise<import("./motions.repository").MotionRecord[]>;
    getCurrentLive(meetingId: string): Promise<import("./motions.repository").MotionRecord | null>;
    getPublicState(meetingId: string): Promise<{
        liveMotion: import("./motions.repository").MotionRecord | null;
        recentOutcomeMotion: import("./motions.repository").MotionRecord | null;
    }>;
    getById(id: string): Promise<import("./motions.repository").MotionRecord>;
    create(dto: CreateMotionDto, user: AuthenticatedUser): Promise<import("./motions.repository").MotionRecord>;
    update(id: string, dto: UpdateMotionDto, user: AuthenticatedUser): Promise<import("./motions.repository").MotionRecord>;
    setLive(id: string, user: AuthenticatedUser): Promise<import("./motions.repository").MotionRecord>;
    setOutcome(id: string, dto: SetMotionOutcomeDto, user: AuthenticatedUser): Promise<import("./motions.repository").MotionRecord>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
}
