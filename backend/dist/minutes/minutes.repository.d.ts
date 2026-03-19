import { PostgresService } from '../database/postgres.service';
import { type MinutesContent } from './minutes-content';
export type MinutesStatus = 'DRAFT' | 'IN_PROGRESS' | 'FINALIZED' | 'PUBLISHED';
export interface MinutesRecord {
    id: string;
    meetingId: string;
    minuteTakerUserId?: string;
    contentJson: MinutesContent;
    status: MinutesStatus;
    startedAt?: string;
    finalizedAt?: string;
    publishedAt?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
interface CreateMinutesInput {
    meetingId: string;
    minuteTakerUserId?: string;
    contentJson?: MinutesContent;
    createdBy: string;
}
export declare class MinutesRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    create(input: CreateMinutesInput): Promise<MinutesRecord>;
    list(meetingId?: string): Promise<MinutesRecord[]>;
    getById(id: string): Promise<MinutesRecord>;
    update(id: string, patch: Partial<MinutesRecord>): Promise<MinutesRecord>;
    private ensureSchema;
    private withFallback;
}
export {};
