import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ActionItemRecord {
  id: string;
  title: string;
  description?: string;
  status: ActionStatus;
  priority: ActionPriority;
  ownerUserId?: string;
  dueDate?: string;
  meetingId?: string;
  resolutionId?: string;
  motionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface CreateActionInput {
  title: string;
  description?: string;
  status: ActionStatus;
  priority: ActionPriority;
  ownerUserId?: string;
  dueDate?: string;
  meetingId?: string;
  resolutionId?: string;
  motionId?: string;
  createdBy: string;
}

@Injectable()
export class ActionsRepository {
  private readonly memory = new Map<string, ActionItemRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async list(query?: { status?: ActionStatus; ownerUserId?: string }): Promise<ActionItemRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const where: string[] = [];
      const params: unknown[] = [];
      if (query?.status) {
        params.push(query.status);
        where.push(`status = $${params.length}`);
      }
      if (query?.ownerUserId) {
        params.push(query.ownerUserId);
        where.push(`owner_user_id = $${params.length}`);
      }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const result = await this.postgresService.query<DbActionRow>(
        `SELECT * FROM app_action_items ${whereClause} ORDER BY due_date ASC NULLS LAST, updated_at DESC`,
        params,
      );
      return result.rows.map((row) => toActionItemRecord(row));
    }, () =>
      Array.from(this.memory.values())
        .filter((item) => (query?.status ? item.status === query.status : true))
        .filter((item) => (query?.ownerUserId ? item.ownerUserId === query.ownerUserId : true))
        .sort((left, right) => (left.dueDate ?? '').localeCompare(right.dueDate ?? '')));
  }

  async getById(id: string): Promise<ActionItemRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbActionRow>(`SELECT * FROM app_action_items WHERE id = $1 LIMIT 1`, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Action item not found');
      }
      return toActionItemRecord(result.rows[0]);
    }, () => {
      const record = this.memory.get(id);
      if (!record) {
        throw new NotFoundException('Action item not found');
      }
      return record;
    });
  }

  async create(input: CreateActionInput): Promise<ActionItemRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbActionRow>(
        `INSERT INTO app_action_items (
          id, title, description, status, priority, owner_user_id, due_date,
          meeting_id, resolution_id, motion_id, created_by, created_at, updated_at, completed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *`,
        [
          randomUUID(),
          input.title,
          input.description,
          input.status,
          input.priority,
          input.ownerUserId,
          input.dueDate,
          input.meetingId,
          input.resolutionId,
          input.motionId,
          input.createdBy,
          now,
          now,
          input.status === 'COMPLETED' ? now : null,
        ],
      );
      return toActionItemRecord(result.rows[0]);
    }, () => {
      const now = new Date().toISOString();
      const record: ActionItemRecord = {
        id: randomUUID(),
        ...input,
        completedAt: input.status === 'COMPLETED' ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };
      this.memory.set(record.id, record);
      return record;
    });
  }

  async update(id: string, patch: Partial<ActionItemRecord>): Promise<ActionItemRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const now = new Date().toISOString();
      const status = patch.status ?? existing.status;
      const result = await this.postgresService.query<DbActionRow>(
        `UPDATE app_action_items
         SET title = $2,
             description = $3,
             status = $4,
             priority = $5,
             owner_user_id = $6,
             due_date = $7,
             completed_at = $8,
             updated_at = $9
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.title ?? existing.title,
          patch.description ?? existing.description ?? null,
          status,
          patch.priority ?? existing.priority,
          patch.ownerUserId ?? existing.ownerUserId ?? null,
          patch.dueDate ?? existing.dueDate ?? null,
          status === 'COMPLETED' ? patch.completedAt ?? existing.completedAt ?? now : null,
          now,
        ],
      );
      return toActionItemRecord(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const status = patch.status ?? existing.status;
      const updated = {
        ...existing,
        ...patch,
        completedAt: status === 'COMPLETED' ? patch.completedAt ?? existing.completedAt ?? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
      this.memory.set(id, updated);
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM app_action_items WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Action item not found');
      }
    }, () => {
      if (!this.memory.delete(id)) {
        throw new NotFoundException('Action item not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }
    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_action_items (
        id UUID PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        priority VARCHAR(30) NOT NULL,
        owner_user_id VARCHAR(255),
        due_date DATE,
        meeting_id UUID,
        resolution_id UUID,
        motion_id UUID,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ
      )
    `);
    await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_action_items_status ON app_action_items(status, due_date)`);
    await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_action_items_owner ON app_action_items(owner_user_id)`);
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

interface DbActionRow {
  id: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  owner_user_id: string | null;
  due_date: string | null;
  meeting_id: string | null;
  resolution_id: string | null;
  motion_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function toActionItemRecord(row: DbActionRow): ActionItemRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    ownerUserId: row.owner_user_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    meetingId: row.meeting_id ?? undefined,
    resolutionId: row.resolution_id ?? undefined,
    motionId: row.motion_id ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}
