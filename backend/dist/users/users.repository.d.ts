import { PostgresService } from '../database/postgres.service';
export interface ManagedUserRecord {
    id: string;
    microsoftOid: string;
    email: string;
    displayName: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}
interface UpsertUserInput {
    microsoftOid: string;
    email: string;
    displayName: string;
    roles: string[];
}
export declare class UsersRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    list(): Promise<ManagedUserRecord[]>;
    getById(id: string): Promise<ManagedUserRecord>;
    findByOidOrEmail(microsoftOid: string, email: string): Promise<ManagedUserRecord | null>;
    upsert(input: UpsertUserInput): Promise<ManagedUserRecord>;
    private ensureSchema;
    private withFallback;
}
export {};
