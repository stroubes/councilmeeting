import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

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
  private isAvailable = true;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('databaseUrl') ?? process.env.DATABASE_URL;
    this.pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

    if (!this.pool) {
      this.logger.warn('DATABASE_URL is not configured. Falling back to in-memory repositories.');
    }
  }

  get isEnabled(): boolean {
    return this.pool !== null && this.isAvailable;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    if (!this.pool || !this.isAvailable) {
      throw new DatabaseUnavailableError('Database is not configured or currently unavailable.');
    }

    try {
      return await this.pool.query<T>(sql, params);
    } catch (error) {
      this.isAvailable = false;
      const message = error instanceof Error ? error.message : 'Unknown database error';
      this.logger.warn(`Database unavailable, switching to in-memory mode: ${message}`);
      throw new DatabaseUnavailableError(message);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
