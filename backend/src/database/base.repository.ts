import { DatabaseUnavailableError, PostgresService } from './postgres.service';
import type { QueryResultRow } from 'pg';

export abstract class BaseRepository {
  protected schemaEnsured = false;
  private readonly schemaVersionsEnsured = new Set<string>();

  constructor(protected readonly postgresService: PostgresService) {}

  protected async withFallback<T>(dbFn: () => Promise<T>, memoryFn: () => Promise<T> | T): Promise<T> {
    if (!this.postgresService.isEnabled) {
      return memoryFn();
    }

    try {
      return await dbFn();
    } catch (caughtError) {
      if (caughtError instanceof DatabaseUnavailableError) {
        return memoryFn();
      }
      throw caughtError;
    }
  }

  protected async ensureSchemaVersion(versionKey: string, ensureFn: () => Promise<void>): Promise<void> {
    if (!this.postgresService.isEnabled) {
      return;
    }
    if (this.schemaVersionsEnsured.has(versionKey)) {
      return;
    }
    await ensureFn();
    this.schemaVersionsEnsured.add(versionKey);
  }

  protected query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
    return this.postgresService.query<T>(sql, params);
  }
}
