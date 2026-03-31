import { Injectable } from '@nestjs/common';
import { PostgresService } from '../database/postgres.service';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  checks: {
    database: {
      status: 'up' | 'down' | 'disabled';
      message: string;
    };
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly postgresService: PostgresService) {}

  async check(): Promise<HealthCheckResponse> {
    if (!this.postgresService.isEnabled) {
      return {
        status: 'degraded',
        checks: {
          database: {
            status: 'disabled',
            message: 'DATABASE_URL is not configured; backend is running in memory mode.',
          },
        },
      };
    }

    try {
      await this.postgresService.query('SELECT 1');
      return {
        status: 'ok',
        checks: {
          database: {
            status: 'up',
            message: 'PostgreSQL connection is healthy.',
          },
        },
      };
    } catch {
      return {
        status: 'degraded',
        checks: {
          database: {
            status: 'down',
            message: 'PostgreSQL connection failed; repositories may fall back to in-memory mode.',
          },
        },
      };
    }
  }
}
