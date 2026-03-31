import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

export class DatabaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private readonly pool: Pool | null;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('databaseUrl') ?? process.env.DATABASE_URL;
    const isProduction = process.env['NODE_ENV'] === 'production';

    if (!databaseUrl) {
      if (isProduction) {
        throw new Error('FATAL: DATABASE_URL is not configured. Cannot start in production mode without a database.');
      }
      this.logger.warn('DATABASE_URL is not configured. Falling back to in-memory repositories.');
      this.pool = null;
      return;
    }

    this.pool = new Pool({ connectionString: databaseUrl });
  }

  get isEnabled(): boolean {
    return this.pool !== null;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database is not configured or currently unavailable.');
    }

    const isProduction = process.env['NODE_ENV'] === 'production';

    try {
      return await this.pool.query<T>(sql, params);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error';
      if (isProduction) {
        throw new Error(`FATAL: Database query failed in production: ${message}`);
      }
      this.logger.warn(`Database query failed; repositories may use in-memory fallback for this request: ${message}`);
      throw new DatabaseUnavailableError(message);
    }
  }

  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database is not configured or currently unavailable.');
    }

    const isProduction = process.env['NODE_ENV'] === 'production';
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {}

      if (!isPgError(error)) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown database transaction error';
      if (isProduction) {
        throw new Error(`FATAL: Database transaction failed in production: ${message}`);
      }
      this.logger.warn(`Database transaction failed; repositories may use in-memory fallback for this request: ${message}`);
      throw new DatabaseUnavailableError(message);
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

function isPgError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error;
}
