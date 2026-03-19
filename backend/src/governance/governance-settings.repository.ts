import { Injectable } from '@nestjs/common';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

@Injectable()
export class GovernanceSettingsRepository {
  private readonly memory = new Map<string, string>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async getValue(key: string): Promise<string | null> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<{ value: string }>(
        `SELECT value FROM app_governance_settings WHERE key = $1 LIMIT 1`,
        [key],
      );
      return result.rows[0]?.value ?? null;
    }, () => this.memory.get(key) ?? null);
  }

  async setValue(key: string, value: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      await this.postgresService.query(
        `INSERT INTO app_governance_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             updated_at = NOW()`,
        [key, value],
      );
    }, () => {
      this.memory.set(key, value);
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_governance_settings (
        key VARCHAR(120) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    this.schemaEnsured = true;
  }

  private async withFallback<T>(dbFn: () => Promise<T>, fallbackFn: () => Promise<T> | T): Promise<T> {
    if (!this.postgresService.isEnabled) {
      return fallbackFn();
    }

    try {
      return await dbFn();
    } catch (error) {
      if (error instanceof DatabaseUnavailableError) {
        return fallbackFn();
      }
      throw error;
    }
  }
}
