import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PostgresService } from '../database/postgres.service';
import { BaseRepository } from '../database/base.repository';
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
  isPublicVisible: boolean;
  publishAt?: string;
  redactionNote?: string;
  carryForwardToNext: boolean;
  sortOrder: number;
  createdBy: string;
  status: AgendaStatus;
  bylawId?: string;
}

interface SaveVersionSnapshotInput {
  agendaId: string;
  version: number;
  title: string;
  status: string;
  snapshotJson: Record<string, unknown>;
  changedBy?: string;
}

interface TransitionAgendaWorkflowInput {
  agendaId: string;
  expectedUpdatedAt: string;
  agendaPatch: Pick<AgendaRecord, 'status' | 'version'> &
    Partial<Pick<AgendaRecord, 'rejectionReason' | 'publishedAt'>>;
  items: AgendaItemRecord[];
}

@Injectable()
export class AgendasRepository extends BaseRepository {
  private readonly memoryAgendas = new Map<string, AgendaRecord>();
  protected schemaEnsured = false;

  constructor(postgresService: PostgresService) {
    super(postgresService);
  }

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
            is_in_camera, is_public_visible, publish_at, redaction_note, carry_forward_to_next,
            sort_order, status, bylaw_id, item_number, publish_status, created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18, $19
          )`,
            [
              item.id,
              agendaId,
              item.itemType,
              item.title,
              item.description,
              item.parentItemId,
              item.isInCamera,
              item.isPublicVisible,
              item.publishAt,
              item.redactionNote,
              item.carryForwardToNext,
              item.sortOrder,
              item.status,
              item.bylawId ?? null,
              item.itemNumber ?? null,
              (item as any).publishStatus ?? 'DRAFT',
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

  async transitionWorkflowState(input: TransitionAgendaWorkflowInput): Promise<AgendaRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();

      return this.postgresService.withTransaction(async (client) => {
        const agendaResult = await client.query<DbAgendaRow>(
          `SELECT * FROM app_agendas WHERE id = $1 LIMIT 1 FOR UPDATE`,
          [input.agendaId],
        );

        if (agendaResult.rows.length === 0) {
          throw new NotFoundException('Agenda not found');
        }

        const existing = agendaResult.rows[0];
        if (!timestampsMatch(existing.updated_at, input.expectedUpdatedAt)) {
          throw new ConflictException('Agenda changed by another user. Refresh and try again.');
        }

        await client.query(`DELETE FROM app_agenda_items WHERE agenda_id = $1`, [input.agendaId]);
        for (const item of input.items) {
          await client.query(
            `INSERT INTO app_agenda_items (
              id, agenda_id, item_type, title, description, parent_item_id,
              is_in_camera, is_public_visible, publish_at, redaction_note, carry_forward_to_next,
              sort_order, status, bylaw_id, item_number, publish_status, created_by, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11,
              $12, $13, $14, $15, $16, $17, $18, $19
            )`,
            [
              item.id,
              input.agendaId,
              item.itemType,
              item.title,
              item.description,
              item.parentItemId,
              item.isInCamera,
              item.isPublicVisible,
              item.publishAt,
              item.redactionNote,
              item.carryForwardToNext,
              item.sortOrder,
              item.status,
              item.bylawId ?? null,
              item.itemNumber ?? null,
              (item as any).publishStatus ?? 'DRAFT',
              item.createdBy,
              item.createdAt,
              item.updatedAt,
            ],
          );
        }

        const updatedAgendaResult = await client.query<DbAgendaRow>(
          `UPDATE app_agendas
             SET status = $2,
                 version = $3,
                 rejection_reason = $4,
                 published_at = $5,
                 updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [
            input.agendaId,
            input.agendaPatch.status,
            input.agendaPatch.version,
            input.agendaPatch.rejectionReason ?? null,
            input.agendaPatch.publishedAt ?? null,
          ],
        );

        const itemsResult = await client.query<DbAgendaItemRow>(
          `SELECT * FROM app_agenda_items WHERE agenda_id = $1 ORDER BY sort_order ASC`,
          [input.agendaId],
        );

        return toAgendaRecord(updatedAgendaResult.rows[0], itemsResult.rows.map((row) => toAgendaItemRecord(row)));
      });
    }, async () => {
      const existing = await this.getById(input.agendaId);
      if (!timestampsMatch(existing.updatedAt, input.expectedUpdatedAt)) {
        throw new ConflictException('Agenda changed by another user. Refresh and try again.');
      }

      const updated: AgendaRecord = {
        ...existing,
        status: input.agendaPatch.status,
        version: input.agendaPatch.version,
        rejectionReason: input.agendaPatch.rejectionReason,
        publishedAt: input.agendaPatch.publishedAt,
        items: input.items,
        updatedAt: new Date().toISOString(),
      };

      this.memoryAgendas.set(input.agendaId, updated);
      return updated;
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
          is_in_camera, is_public_visible, publish_at, redaction_note, carry_forward_to_next,
          sort_order, status, bylaw_id, item_number, publish_status, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, 'DRAFT', $16, $17, $18
        ) RETURNING *`,
        [
          id,
          input.agendaId,
          input.itemType,
          input.title,
          input.description,
          input.parentItemId,
          input.isInCamera,
          input.isPublicVisible,
          input.publishAt,
          input.redactionNote,
          input.carryForwardToNext,
          input.sortOrder,
          input.status,
          input.bylawId ?? null,
          null,
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
        isPublicVisible: input.isPublicVisible,
        publishAt: input.publishAt,
        redactionNote: input.redactionNote,
        carryForwardToNext: input.carryForwardToNext,
        sortOrder: input.sortOrder,
        status: input.status,
        bylawId: input.bylawId,
        publishStatus: 'DRAFT',
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
    patch: Partial<
      Pick<
        AgendaItemRecord,
        'title' | 'description' | 'parentItemId' | 'isInCamera' | 'itemType' | 'status' | 'isPublicVisible' | 'publishAt' | 'redactionNote' | 'carryForwardToNext' | 'bylawId' | 'itemNumber'
      >
    >,
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
             is_public_visible = $8,
             publish_at = $9,
             redaction_note = $10,
             carry_forward_to_next = $11,
             status = $12,
             bylaw_id = $13,
             item_number = $14,
             publish_status = $15,
             updated_at = $16
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
          patch.isPublicVisible ?? current.isPublicVisible,
          patch.publishAt ?? current.publishAt ?? null,
          patch.redactionNote ?? current.redactionNote ?? null,
          patch.carryForwardToNext ?? current.carryForwardToNext,
          patch.status ?? current.status,
          patch.bylawId ?? current.bylawId ?? null,
          patch.itemNumber ?? current.itemNumber ?? null,
          (patch as any).publishStatus ?? current.publishStatus ?? 'DRAFT',
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

  async saveVersionSnapshot(input: SaveVersionSnapshotInput): Promise<void> {
    await this.ensureSchema();
    await this.postgresService.query(
      `INSERT INTO agenda_version_history (id, agenda_id, version, title, status, snapshot_json, changed_by, changed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        randomUUID(),
        input.agendaId,
        input.version,
        input.title,
        input.status,
        JSON.stringify(input.snapshotJson),
        input.changedBy ?? null,
      ],
    );
  }

  async getAgendaVersionHistory(agendaId: string): Promise<unknown[]> {
    await this.ensureSchema();
    const result = await this.postgresService.query(
      `SELECT * FROM agenda_version_history WHERE agenda_id = $1 ORDER BY version ASC`,
      [agendaId],
    );
    return result.rows;
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
        is_public_visible BOOLEAN NOT NULL DEFAULT TRUE,
        publish_at TIMESTAMPTZ,
        redaction_note TEXT,
        carry_forward_to_next BOOLEAN NOT NULL DEFAULT FALSE,
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
    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS agenda_version_history (
        id UUID PRIMARY KEY,
        agenda_id UUID NOT NULL,
        version INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        snapshot_json JSONB NOT NULL,
        changed_by VARCHAR(255),
        changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_agenda_version_history_agenda ON agenda_version_history(agenda_id, version)`,
    );
    await this.postgresService.query(`ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS is_public_visible BOOLEAN NOT NULL DEFAULT TRUE`);
    await this.postgresService.query(`ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ`);
    await this.postgresService.query(`ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS redaction_note TEXT`);
    await this.postgresService.query(`ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS carry_forward_to_next BOOLEAN NOT NULL DEFAULT FALSE`);
    await this.postgresService.query(`ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS bylaw_id UUID`);
    await this.postgresService.query(`ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS item_number VARCHAR(50)`);
    await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_agenda_items_bylaw_id ON app_agenda_items(bylaw_id) WHERE bylaw_id IS NOT NULL`);
    await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_agenda_items_item_number ON app_agenda_items(item_number) WHERE item_number IS NOT NULL`);
    await this.postgresService.query(`ALTER TABLE app_agenda_items ADD COLUMN IF NOT EXISTS publish_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT'`);
    await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_agenda_items_publish_status ON app_agenda_items(publish_status)`);

    await this.postgresService.query(
      `DELETE FROM app_agendas a WHERE NOT EXISTS (
         SELECT 1 FROM app_meetings m WHERE m.id = a.meeting_id
       )`,
    );
    await this.postgresService.query(
      `DELETE FROM app_agenda_items i WHERE NOT EXISTS (
         SELECT 1 FROM app_agendas a WHERE a.id = i.agenda_id
       )`,
    );

    await this.postgresService.query(`
      DO $$
      BEGIN
        IF to_regclass('public.app_meetings') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_agendas_meeting'
          ) THEN
          ALTER TABLE app_agendas
            ADD CONSTRAINT fk_app_agendas_meeting
            FOREIGN KEY (meeting_id) REFERENCES app_meetings(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_agenda_items_agenda'
        ) THEN
          ALTER TABLE app_agenda_items
            ADD CONSTRAINT fk_app_agenda_items_agenda
            FOREIGN KEY (agenda_id) REFERENCES app_agendas(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    this.schemaEnsured = true;
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
  is_public_visible: boolean;
  publish_at: string | null;
  redaction_note: string | null;
  carry_forward_to_next: boolean;
  sort_order: number;
  status: AgendaStatus;
  bylaw_id: string | null;
  item_number: string | null;
  publish_status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
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
    isPublicVisible: row.is_public_visible,
    publishAt: row.publish_at ?? undefined,
    redactionNote: row.redaction_note ?? undefined,
    carryForwardToNext: row.carry_forward_to_next,
    sortOrder: row.sort_order,
    status: row.status,
    bylawId: row.bylaw_id ?? undefined,
    itemNumber: row.item_number ?? undefined,
    publishStatus: row.publish_status,
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

function timestampsMatch(left: string | Date, right: string | Date): boolean {
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return String(left) === String(right);
  }

  return leftTime === rightTime;
}
