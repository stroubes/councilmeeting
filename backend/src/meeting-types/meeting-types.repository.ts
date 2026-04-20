import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export interface MeetingTypeRecord {
  id: string;
  code: string;
  name: string;
  description?: string;
  isInCamera: boolean;
  isActive: boolean;
  createdBy: string;
  wizardConfig?: {
    defaultAgendaTemplateId?: string;
    defaultWorkflowCode?: string;
    publishWindowHours?: number;
    carryForwardEnabled?: boolean;
  };
  standingItems?: Array<{
    itemType: string;
    title: string;
    description?: string;
    isInCamera?: boolean;
    carryForwardToNext?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface CreateMeetingTypeInput {
  code: string;
  name: string;
  description?: string;
  isInCamera: boolean;
  isActive: boolean;
  createdBy: string;
  wizardConfig?: MeetingTypeRecord['wizardConfig'];
  standingItems?: MeetingTypeRecord['standingItems'];
}

const DEFAULT_MEETING_TYPES: Array<Pick<MeetingTypeRecord, 'code' | 'name' | 'description' | 'isInCamera'>> = [
  {
    code: 'COUNCIL',
    name: 'Council Meeting',
    description: 'Regular public council meeting.',
    isInCamera: false,
  },
  {
    code: 'SPECIAL_COUNCIL',
    name: 'Special Council Meeting',
    description: 'Specially called council session.',
    isInCamera: false,
  },
  {
    code: 'COMMITTEE_OF_WHOLE',
    name: 'Committee of the Whole',
    description: 'Committee of the Whole meeting.',
    isInCamera: false,
  },
  {
    code: 'IN_CAMERA',
    name: 'In-Camera Meeting',
    description: 'Closed in-camera meeting.',
    isInCamera: true,
  },
];

@Injectable()
export class MeetingTypesRepository {
  private schemaEnsured = false;
  private readonly memoryMeetingTypes = new Map<string, MeetingTypeRecord>();

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: CreateMeetingTypeInput): Promise<MeetingTypeRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const created = await this.postgresService.query<DbMeetingTypeRow>(
        `INSERT INTO app_meeting_types (
          id, code, name, description, is_in_camera, is_active, created_by,
          wizard_config_json, standing_items_json, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          id,
          input.code,
          input.name,
          input.description,
          input.isInCamera,
          input.isActive,
          input.createdBy,
          input.wizardConfig ?? null,
          input.standingItems ?? null,
          now,
          now,
        ],
      );
      return toMeetingTypeRecord(created.rows[0]);
    }, () => this.createInMemory(input));
  }

  async list(query?: { includeInactive?: boolean }): Promise<MeetingTypeRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const whereClause = query?.includeInactive ? '' : 'WHERE is_active = TRUE';
      const result = await this.postgresService.query<DbMeetingTypeRow>(
        `SELECT * FROM app_meeting_types ${whereClause} ORDER BY name ASC`,
      );
      return result.rows.map((row) => toMeetingTypeRecord(row));
    }, () => this.listInMemory(query));
  }

  async getByCode(code: string): Promise<MeetingTypeRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbMeetingTypeRow>(
        `SELECT * FROM app_meeting_types WHERE code = $1 LIMIT 1`,
        [code],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Meeting type not found');
      }
      return toMeetingTypeRecord(result.rows[0]);
    }, () => {
      const found = Array.from(this.memoryMeetingTypes.values()).find((meetingType) => meetingType.code === code);
      if (!found) {
        throw new NotFoundException('Meeting type not found');
      }
      return found;
    });
  }

  async remove(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(`DELETE FROM app_meeting_types WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Meeting type not found');
      }
    }, () => {
      if (!this.memoryMeetingTypes.delete(id)) {
        throw new NotFoundException('Meeting type not found');
      }
    });
  }

  async update(
    id: string,
    patch: Partial<
      Pick<MeetingTypeRecord, 'name' | 'description' | 'isInCamera' | 'isActive' | 'wizardConfig' | 'standingItems'>
    >,
  ): Promise<MeetingTypeRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existingResult = await this.postgresService.query<DbMeetingTypeRow>(
        `SELECT * FROM app_meeting_types WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (existingResult.rows.length === 0) {
        throw new NotFoundException('Meeting type not found');
      }
      const existing = toMeetingTypeRecord(existingResult.rows[0]);
      const updatedAt = new Date().toISOString();
      const result = await this.postgresService.query<DbMeetingTypeRow>(
        `UPDATE app_meeting_types
         SET name = $2,
             description = $3,
             is_in_camera = $4,
             is_active = $5,
             wizard_config_json = $6,
             standing_items_json = $7,
             updated_at = $8
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.name ?? existing.name,
          patch.description ?? existing.description ?? null,
          patch.isInCamera ?? existing.isInCamera,
          patch.isActive ?? existing.isActive,
          patch.wizardConfig ?? existing.wizardConfig ?? null,
          patch.standingItems ?? existing.standingItems ?? null,
          updatedAt,
        ],
      );
      return toMeetingTypeRecord(result.rows[0]);
    }, async () => {
      this.seedMemoryDefaults();
      const existing = this.memoryMeetingTypes.get(id);
      if (!existing) {
        throw new NotFoundException('Meeting type not found');
      }
      const updated: MeetingTypeRecord = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.memoryMeetingTypes.set(id, updated);
      return updated;
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_meeting_types (
        id UUID PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        is_in_camera BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        wizard_config_json JSONB,
        standing_items_json JSONB,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);

    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_meeting_types_active ON app_meeting_types(is_active, name)`,
    );

    await this.postgresService.query(`ALTER TABLE app_meeting_types ADD COLUMN IF NOT EXISTS wizard_config_json JSONB`);
    await this.postgresService.query(`ALTER TABLE app_meeting_types ADD COLUMN IF NOT EXISTS standing_items_json JSONB`);
    await this.postgresService.query(`ALTER TABLE app_meeting_types ADD COLUMN IF NOT EXISTS council_size INTEGER NOT NULL DEFAULT 0`);
    await this.postgresService.query(`ALTER TABLE app_meeting_types ADD COLUMN IF NOT EXISTS quorum_required BOOLEAN NOT NULL DEFAULT TRUE`);

    await this.postgresService.query(`
      UPDATE app_meeting_types
         SET council_size = CASE
           WHEN code IN ('COUNCIL', 'SPECIAL_COUNCIL') THEN 5
           WHEN code = 'COMMITTEE_OF_WHOLE' THEN 5
           ELSE council_size
         END
       WHERE council_size = 0
    `);

    const result = await this.postgresService.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM app_meeting_types`);
    const count = Number.parseInt(result.rows[0]?.count ?? '0', 10);

    if (count === 0) {
      const now = new Date().toISOString();
      for (const meetingType of DEFAULT_MEETING_TYPES) {
        await this.postgresService.query(
          `INSERT INTO app_meeting_types (
            id, code, name, description, is_in_camera, is_active, created_by,
            wizard_config_json, standing_items_json, council_size, quorum_required, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, TRUE, 'system', NULL, NULL, $6, TRUE, $7, $8)`,
          [
            randomUUID(),
            meetingType.code,
            meetingType.name,
            meetingType.description,
            meetingType.isInCamera,
            meetingType.code === 'IN_CAMERA' ? 0 : 5,
            now,
            now,
          ],
        );
      }
    }

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

  private createInMemory(input: CreateMeetingTypeInput): MeetingTypeRecord {
    this.seedMemoryDefaults();
    const now = new Date().toISOString();
    const meetingType: MeetingTypeRecord = {
      id: randomUUID(),
      code: input.code,
      name: input.name,
      description: input.description,
      isInCamera: input.isInCamera,
      isActive: input.isActive,
      createdBy: input.createdBy,
      wizardConfig: input.wizardConfig,
      standingItems: input.standingItems,
      createdAt: now,
      updatedAt: now,
    };
    this.memoryMeetingTypes.set(meetingType.id, meetingType);
    return meetingType;
  }

  private listInMemory(query?: { includeInactive?: boolean }): MeetingTypeRecord[] {
    this.seedMemoryDefaults();
    return Array.from(this.memoryMeetingTypes.values())
      .filter((meetingType) => (query?.includeInactive ? true : meetingType.isActive))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private seedMemoryDefaults(): void {
    if (this.memoryMeetingTypes.size > 0) {
      return;
    }

    const now = new Date().toISOString();
    for (const meetingType of DEFAULT_MEETING_TYPES) {
      const id = randomUUID();
      this.memoryMeetingTypes.set(id, {
        id,
        code: meetingType.code,
        name: meetingType.name,
        description: meetingType.description,
        isInCamera: meetingType.isInCamera,
        isActive: true,
        createdBy: 'system',
        wizardConfig: undefined,
        standingItems: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

interface DbMeetingTypeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_in_camera: boolean;
  is_active: boolean;
  wizard_config_json: unknown | null;
  standing_items_json: unknown | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toMeetingTypeRecord(row: DbMeetingTypeRow): MeetingTypeRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    isInCamera: row.is_in_camera,
    isActive: row.is_active,
    wizardConfig: (row.wizard_config_json as MeetingTypeRecord['wizardConfig']) ?? undefined,
    standingItems: (row.standing_items_json as MeetingTypeRecord['standingItems']) ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
