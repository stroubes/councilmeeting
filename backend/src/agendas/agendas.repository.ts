import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';
import type { AgendaItemRecord, AgendaRecord, AgendaStatus } from './agendas.service';

interface CreateAgendaInput {
  meetingId: string;
  templateId?: string;
  title: string;
  createdBy: string;
}

interface CreateAgendaItemInput {
  agendaId: string;
  itemType: string;
  title: string;
  description?: string;
  parentItemId?: string;
  isInCamera: boolean;
  sortOrder: number;
  createdBy: string;
  status: AgendaStatus;
}

@Injectable()
export class AgendasRepository {
  private readonly memoryAgendas = new Map<string, AgendaRecord>();
  private schemaEnsured = false;

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: CreateAgendaInput): Promise<AgendaRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      await this.postgresService.query(
        `INSERT INTO app_agendas (
          id, meeting_id, template_id, title, status, version, rejection_reason,
          published_at, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 'DRAFT', 1, NULL,
          NULL, $5, $6, $7
        )`,
        [id, input.meetingId, input.templateId, input.title, input.createdBy, now, now],
      );

      return this.getById(id);
    }, () => this.createInMemory(input));
  }

  async list(meetingId?: string): Promise<AgendaRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const params: unknown[] = [];
      const whereClause = meetingId ? `WHERE meeting_id = $1` : '';
      if (meetingId) {
        params.push(meetingId);
      }

      const agendasResult = await this.postgresService.query<DbAgendaRow>(
        `SELECT * FROM app_agendas ${whereClause} ORDER BY updated_at DESC`,
        params,
      );

      if (agendasResult.rows.length === 0) {
        return [];
      }

      const agendaIds = agendasResult.rows.map((row) => row.id);
      const itemsResult = await this.postgresService.query<DbAgendaItemRow>(
        `SELECT * FROM app_agenda_items WHERE agenda_id = ANY($1::uuid[]) ORDER BY sort_order ASC`,
        [agendaIds],
      );
      const itemsByAgendaId = groupItemsByAgenda(itemsResult.rows);

      return agendasResult.rows.map((row) => toAgendaRecord(row, itemsByAgendaId.get(row.id) ?? []));
    }, () => {
      const agendas = Array.from(this.memoryAgendas.values());
      return agendas
        .filter((agenda) => (meetingId ? agenda.meetingId === meetingId : true))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  }

  async getById(id: string): Promise<AgendaRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const agendaResult = await this.postgresService.query<DbAgendaRow>(
        `SELECT * FROM app_agendas WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (agendaResult.rows.length === 0) {
        throw new NotFoundException('Agenda not found');
      }

      const itemsResult = await this.postgresService.query<DbAgendaItemRow>(
        `SELECT * FROM app_agenda_items WHERE agenda_id = $1 ORDER BY sort_order ASC`,
        [id],
      );

      return toAgendaRecord(agendaResult.rows[0], itemsResult.rows.map((row) => toAgendaItemRecord(row)));
    }, () => {
      const agenda = this.memoryAgendas.get(id);
      if (!agenda) {
        throw new NotFoundException('Agenda not found');
      }
      return agenda;
    });
  }

  async update(
    id: string,
    patch: Partial<Pick<AgendaRecord, 'title' | 'status' | 'version' | 'rejectionReason' | 'publishedAt'>>,
  ): Promise<AgendaRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const updatedAt = new Date().toISOString();
      await this.postgresService.query(
        `UPDATE app_agendas
         SET title = $2,
             status = $3,
             version = $4,
             rejection_reason = $5,
             published_at = $6,
             updated_at = $7
         WHERE id = $1`,
        [
          id,
          patch.title ?? existing.title,
          patch.status ?? existing.status,
          patch.version ?? existing.version,
          patch.rejectionReason ?? existing.rejectionReason ?? null,
          patch.publishedAt ?? existing.publishedAt ?? null,
          updatedAt,
        ],
      );

      return this.getById(id);
    }, async () => {
      const existing = await this.getById(id);
      const updated: AgendaRecord = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.memoryAgendas.set(id, updated);
      return updated;
    });
  }

  async replaceItems(agendaId: string, items: AgendaItemRecord[]): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      await this.postgresService.query(`DELETE FROM app_agenda_items WHERE agenda_id = $1`, [agendaId]);
      if (items.length === 0) {
        return;
      }

      for (const item of items) {
        await this.postgresService.query(
          `INSERT INTO app_agenda_items (
            id, agenda_id, item_type, title, description, parent_item_id,
            is_in_camera, sort_order, status, created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12
          )`,
          [
            item.id,
            agendaId,
            item.itemType,
            item.title,
            item.description,
            item.parentItemId,
            item.isInCamera,
            item.sortOrder,
            item.status,
            item.createdBy,
            item.createdAt,
            item.updatedAt,
          ],
        );
      }
    }, async () => {
      const existing = await this.getById(agendaId);
      this.memoryAgendas.set(agendaId, {
        ...existing,
        items,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async addItem(input: CreateAgendaItemInput): Promise<AgendaItemRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbAgendaItemRow>(
        `INSERT INTO app_agenda_items (
          id, agenda_id, item_type, title, description, parent_item_id,
          is_in_camera, sort_order, status, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        ) RETURNING *`,
        [
          id,
          input.agendaId,
          input.itemType,
          input.title,
          input.description,
          input.parentItemId,
          input.isInCamera,
          input.sortOrder,
          input.status,
          input.createdBy,
          now,
          now,
        ],
      );

      return toAgendaItemRecord(result.rows[0]);
    }, async () => {
      const agenda = await this.getById(input.agendaId);
      const now = new Date().toISOString();
      const item: AgendaItemRecord = {
        id: randomUUID(),
        agendaId: input.agendaId,
        itemType: input.itemType,
        title: input.title,
        description: input.description,
        parentItemId: input.parentItemId,
        isInCamera: input.isInCamera,
        sortOrder: input.sortOrder,
        status: input.status,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      };

      this.memoryAgendas.set(agenda.id, {
        ...agenda,
        items: [...agenda.items, item],
        updatedAt: now,
      });

      return item;
    });
  }

  async updateItem(
    agendaId: string,
    itemId: string,
    patch: Partial<Pick<AgendaItemRecord, 'title' | 'description' | 'parentItemId' | 'isInCamera' | 'itemType' | 'status'>>,
  ): Promise<AgendaItemRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const currentResult = await this.postgresService.query<DbAgendaItemRow>(
        `SELECT * FROM app_agenda_items WHERE agenda_id = $1 AND id = $2 LIMIT 1`,
        [agendaId, itemId],
      );

      if (currentResult.rows.length === 0) {
        throw new NotFoundException('Agenda item not found');
      }

      const current = toAgendaItemRecord(currentResult.rows[0]);
      const updatedAt = new Date().toISOString();
      const result = await this.postgresService.query<DbAgendaItemRow>(
        `UPDATE app_agenda_items
         SET item_type = $3,
             title = $4,
             description = $5,
             parent_item_id = $6,
             is_in_camera = $7,
             status = $8,
             updated_at = $9
         WHERE agenda_id = $1 AND id = $2
         RETURNING *`,
        [
          agendaId,
          itemId,
          patch.itemType ?? current.itemType,
          patch.title ?? current.title,
          patch.description ?? null,
          patch.parentItemId ?? null,
          patch.isInCamera ?? current.isInCamera,
          patch.status ?? current.status,
          updatedAt,
        ],
      );

      return toAgendaItemRecord(result.rows[0]);
    }, async () => {
      const agenda = await this.getById(agendaId);
      const item = agenda.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        throw new NotFoundException('Agenda item not found');
      }

      const updatedItem: AgendaItemRecord = {
        ...item,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      this.memoryAgendas.set(agenda.id, {
        ...agenda,
        items: agenda.items.map((candidate) => (candidate.id === itemId ? updatedItem : candidate)),
        updatedAt: new Date().toISOString(),
      });

      return updatedItem;
    });
  }

  async hasAgendaItem(itemId: string): Promise<boolean> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<{ exists: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM app_agenda_items WHERE id = $1) AS exists`,
        [itemId],
      );
      return result.rows[0]?.exists === true;
    }, () =>
      Array.from(this.memoryAgendas.values()).some((agenda) =>
        agenda.items.some((item) => item.id === itemId),
      ));
  }

  async remove(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      await this.postgresService.query(`DELETE FROM app_agenda_items WHERE agenda_id = $1`, [id]);
      const deleted = await this.postgresService.query(`DELETE FROM app_agendas WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Agenda not found');
      }
    }, () => {
      if (!this.memoryAgendas.delete(id)) {
        throw new NotFoundException('Agenda not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_agendas (
        id UUID PRIMARY KEY,
        meeting_id UUID NOT NULL,
        template_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        version INTEGER NOT NULL,
        rejection_reason TEXT,
        published_at TIMESTAMPTZ,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_agenda_items (
        id UUID PRIMARY KEY,
        agenda_id UUID NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        parent_item_id UUID,
        is_in_camera BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_agendas_meeting_id ON app_agendas(meeting_id)`,
    );
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_agenda_items_agenda_id ON app_agenda_items(agenda_id)`,
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

  private createInMemory(input: CreateAgendaInput): AgendaRecord {
    const now = new Date().toISOString();
    const agenda: AgendaRecord = {
      id: randomUUID(),
      meetingId: input.meetingId,
      templateId: input.templateId,
      title: input.title,
      status: 'DRAFT',
      version: 1,
      items: [],
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryAgendas.set(agenda.id, agenda);
    return agenda;
  }
}

interface DbAgendaRow {
  id: string;
  meeting_id: string;
  template_id: string | null;
  title: string;
  status: AgendaStatus;
  version: number;
  rejection_reason: string | null;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DbAgendaItemRow {
  id: string;
  agenda_id: string;
  item_type: string;
  title: string;
  description: string | null;
  parent_item_id: string | null;
  is_in_camera: boolean;
  sort_order: number;
  status: AgendaStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toAgendaRecord(row: DbAgendaRow, items: AgendaItemRecord[]): AgendaRecord {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    templateId: row.template_id ?? undefined,
    title: row.title,
    status: row.status,
    version: row.version,
    rejectionReason: row.rejection_reason ?? undefined,
    items,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? undefined,
  };
}

function toAgendaItemRecord(row: DbAgendaItemRow): AgendaItemRecord {
  return {
    id: row.id,
    agendaId: row.agenda_id,
    itemType: row.item_type,
    title: row.title,
    description: row.description ?? undefined,
    parentItemId: row.parent_item_id ?? undefined,
    isInCamera: row.is_in_camera,
    sortOrder: row.sort_order,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function groupItemsByAgenda(rows: DbAgendaItemRow[]): Map<string, AgendaItemRecord[]> {
  const grouped = new Map<string, AgendaItemRecord[]>();

  for (const row of rows) {
    const current = grouped.get(row.agenda_id) ?? [];
    current.push(toAgendaItemRecord(row));
    grouped.set(row.agenda_id, current);
  }

  return grouped;
}
