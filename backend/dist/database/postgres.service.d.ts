import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type QueryResult, type QueryResultRow } from 'pg';
export declare class DatabaseUnavailableError extends Error {
    constructor(message: string);
}
export declare class PostgresService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly pool;
    private isAvailable;
    constructor(configService: ConfigService);
    get isEnabled(): boolean;
    query<T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
    onModuleDestroy(): Promise<void>;
}
