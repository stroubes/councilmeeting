import { PostgresService } from '../database/postgres.service';
export interface MeetingTypeRecord {
    id: string;
    code: string;
    name: string;
    description?: string;
    isInCamera: boolean;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
interface CreateMeetingTypeInput {
    code: string;
    name: string;
    description?: string;
    isInCamera: boolean;
    isActive: boolean;
    createdBy: string;
}
export declare class MeetingTypesRepository {
    private readonly postgresService;
    private schemaEnsured;
    private readonly memoryMeetingTypes;
    constructor(postgresService: PostgresService);
    create(input: CreateMeetingTypeInput): Promise<MeetingTypeRecord>;
    list(query?: {
        includeInactive?: boolean;
    }): Promise<MeetingTypeRecord[]>;
    getByCode(code: string): Promise<MeetingTypeRecord>;
    remove(id: string): Promise<void>;
    private ensureSchema;
    private withFallback;
    private createInMemory;
    private listInMemory;
    private seedMemoryDefaults;
}
export {};
