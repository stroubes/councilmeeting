import { PostgresService } from '../database/postgres.service';
export declare class GovernanceSettingsRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    getValue(key: string): Promise<string | null>;
    setValue(key: string, value: string): Promise<void>;
    private ensureSchema;
    private withFallback;
}
