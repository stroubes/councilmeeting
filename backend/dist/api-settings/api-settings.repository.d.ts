import { PostgresService } from '../database/postgres.service';
export interface ApiSettingRecord {
    id: string;
    key: string;
    label: string;
    category?: string;
    value: string;
    isSecret: boolean;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}
export declare class ApiSettingsRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    list(): Promise<ApiSettingRecord[]>;
    upsert(input: {
        key: string;
        label: string;
        category?: string;
        value: string;
        isSecret: boolean;
        updatedBy: string;
    }): Promise<ApiSettingRecord>;
    remove(id: string): Promise<void>;
    private ensureSchema;
    private withFallback;
}
