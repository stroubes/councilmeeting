import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export interface BylawRecord {
  id: string;
  bylawNumber: string;
  title: string;
  description?: string;
  contentJson: Record<string, unknown>;
  adoptedAt?: string;
  amendedAt?: string;
  repealingMeetingId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateBylawInput {
  bylawNumber: string;
  title: string;
  description?: string;
  contentJson?: Record<string, unknown>;
  adoptedAt?: string;
  createdBy?: string;
}

interface UpdateBylawInput {
  title?: string;
  description?: string;
  contentJson?: Record<string, unknown>;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  amendedAt?: string;
  repealingMeetingId?: string;
  updatedBy?: string;
}

@Injectable()
export class BylawsRepository {
  private schemaEnsured = false;
  private readonly memoryBylaws = new Map<string, BylawRecord>();

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: CreateBylawInput): Promise<BylawRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbBylawRow>(
        `INSERT INTO bylaws (
          id, bylaw_number, title, description, content_json, adopted_at, status, created_by, updated_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8, $9, $10)
        RETURNING *`,
        [
          id,
          input.bylawNumber,
          input.title,
          input.description ?? null,
          JSON.stringify(input.contentJson ?? {}),
          input.adoptedAt ?? null,
          input.createdBy ?? null,
          input.createdBy ?? null,
          now,
          now,
        ],
      );
      return toBylawRecord(result.rows[0]);
    }, () => this.createInMemory(input));
  }

  async list(): Promise<BylawRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbBylawRow>(
        `SELECT * FROM bylaws WHERE status != 'DELETED' ORDER BY bylaw_number ASC`,
      );
      return result.rows.map(toBylawRecord);
    }, () =>
      Array.from(this.memoryBylaws.values())
        .filter((b) => b.status !== 'DELETED')
        .sort((a, b) => a.bylawNumber.localeCompare(b.bylawNumber)),
    );
  }

  async listActive(): Promise<BylawRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbBylawRow>(
        `SELECT * FROM bylaws WHERE status = 'ACTIVE' ORDER BY bylaw_number ASC`,
      );
      return result.rows.map(toBylawRecord);
    }, () =>
      Array.from(this.memoryBylaws.values())
        .filter((b) => b.status === 'ACTIVE')
        .sort((a, b) => a.bylawNumber.localeCompare(b.bylawNumber)),
    );
  }

  async getById(id: string): Promise<BylawRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbBylawRow>(
        `SELECT * FROM bylaws WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Bylaw not found');
      }
      return toBylawRecord(result.rows[0]);
    }, () => {
      const found = Array.from(this.memoryBylaws.values()).find((b) => b.id === id);
      if (!found) {
        throw new NotFoundException('Bylaw not found');
      }
      return found;
    });
  }

  async getByNumber(bylawNumber: string): Promise<BylawRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbBylawRow>(
        `SELECT * FROM bylaws WHERE bylaw_number = $1 LIMIT 1`,
        [bylawNumber],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Bylaw not found');
      }
      return toBylawRecord(result.rows[0]);
    }, () => {
      const found = Array.from(this.memoryBylaws.values()).find((b) => b.bylawNumber === bylawNumber);
      if (!found) {
        throw new NotFoundException('Bylaw not found');
      }
      return found;
    });
  }

  async findByNumber(bylawNumber: string): Promise<BylawRecord | null> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbBylawRow>(
        `SELECT * FROM bylaws WHERE bylaw_number = $1 LIMIT 1`,
        [bylawNumber],
      );
      return result.rows.length > 0 ? toBylawRecord(result.rows[0]) : null;
    }, () =>
      Array.from(this.memoryBylaws.values()).find((b) => b.bylawNumber === bylawNumber) ?? null,
    );
  }

  async update(id: string, patch: UpdateBylawInput): Promise<BylawRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const updatedAt = new Date().toISOString();
      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (patch.title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(patch.title);
      }
      if (patch.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(patch.description);
      }
      if (patch.contentJson !== undefined) {
        fields.push(`content_json = $${paramIndex++}`);
        values.push(JSON.stringify(patch.contentJson));
      }
      if (patch.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(patch.status);
      }
      if (patch.amendedAt !== undefined) {
        fields.push(`amended_at = $${paramIndex++}`);
        values.push(patch.amendedAt);
      }
      if (patch.repealingMeetingId !== undefined) {
        fields.push(`repealing_meeting_id = $${paramIndex++}`);
        values.push(patch.repealingMeetingId);
      }
      if (patch.updatedBy !== undefined) {
        fields.push(`updated_by = $${paramIndex++}`);
        values.push(patch.updatedBy);
      }

      fields.push(`updated_at = $${paramIndex++}`);
      values.push(updatedAt);
      values.push(id);

      const result = await this.postgresService.query<DbBylawRow>(
        `UPDATE bylaws SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values,
      );
      return toBylawRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: BylawRecord = {
        ...existing,
        ...patch,
        id,
        updatedAt: new Date().toISOString(),
      };
      this.memoryBylaws.set(id, updated);
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      await this.getById(id);
      await this.postgresService.query(
        `UPDATE bylaws SET status = 'DELETED', updated_at = $2 WHERE id = $1`,
        [id, new Date().toISOString()],
      );
    }, async () => {
      const existing = await this.getById(id);
      const deleted: BylawRecord = { ...existing, status: 'DELETED', updatedAt: new Date().toISOString() };
      this.memoryBylaws.set(id, deleted);
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS bylaws (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bylaw_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        content_json JSONB NOT NULL DEFAULT '{}',
        adopted_at TIMESTAMPTZ,
        amended_at TIMESTAMPTZ,
        repealing_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
        status record_status_enum NOT NULL DEFAULT 'ACTIVE',
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_bylaws_bylaw_number ON bylaws(bylaw_number)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_bylaws_status ON bylaws(status)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_bylaws_adopted_at ON bylaws(adopted_at)`,
    );

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

  private createInMemory(input: CreateBylawInput): BylawRecord {
    const now = new Date().toISOString();
    const record: BylawRecord = {
      id: randomUUID(),
      bylawNumber: input.bylawNumber,
      title: input.title,
      description: input.description,
      contentJson: input.contentJson ?? {},
      adoptedAt: input.adoptedAt,
      status: 'ACTIVE',
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryBylaws.set(record.id, record);
    return record;
  }
}

interface DbBylawRow {
  id: string;
  bylaw_number: string;
  title: string;
  description: string | null;
  content_json: Record<string, unknown>;
  adopted_at: string | null;
  amended_at: string | null;
  repealing_meeting_id: string | null;
  status: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

function toBylawRecord(row: DbBylawRow): BylawRecord {
  return {
    id: row.id,
    bylawNumber: row.bylaw_number,
    title: row.title,
    description: row.description ?? undefined,
    contentJson: row.content_json,
    adoptedAt: row.adopted_at ?? undefined,
    amendedAt: row.amended_at ?? undefined,
    repealingMeetingId: row.repealing_meeting_id ?? undefined,
    status: row.status as BylawRecord['status'],
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
