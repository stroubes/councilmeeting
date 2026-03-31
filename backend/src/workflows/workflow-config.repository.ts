import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseUnavailableError, PostgresService } from '../database/postgres.service';

export type WorkflowDomain = 'REPORT';

export interface WorkflowStageRecord {
  id: string;
  workflowId: string;
  key: string;
  name: string;
  approverRole: string;
  sortOrder: number;
  requireOnlyOneApproval: boolean;
  isOrdered: boolean;
  minimumApprovals: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRecord {
  id: string;
  code: string;
  name: string;
  description?: string;
  domain: WorkflowDomain;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stages: WorkflowStageRecord[];
}

interface CreateWorkflowInput {
  code: string;
  name: string;
  description?: string;
  domain: WorkflowDomain;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
}

interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

interface CreateWorkflowStageInput {
  workflowId: string;
  key: string;
  name: string;
  approverRole: string;
  sortOrder: number;
  requireOnlyOneApproval: boolean;
  isOrdered: boolean;
  minimumApprovals: number;
}

interface UpdateWorkflowStageInput {
  key?: string;
  name?: string;
  approverRole?: string;
  requireOnlyOneApproval?: boolean;
  isOrdered?: boolean;
  minimumApprovals?: number;
}

@Injectable()
export class WorkflowConfigRepository {
  private schemaEnsured = false;
  private readonly memoryWorkflows = new Map<string, WorkflowRecord>();

  constructor(private readonly postgresService: PostgresService) {}

  async create(input: CreateWorkflowInput): Promise<WorkflowRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const id = randomUUID();
      const now = new Date().toISOString();
      const result = await this.postgresService.query<DbWorkflowRow>(
        `INSERT INTO app_workflows (
          id, code, name, description, domain, is_active, is_default, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          id,
          input.code,
          input.name,
          input.description,
          input.domain,
          input.isActive,
          input.isDefault,
          input.createdBy,
          now,
          now,
        ],
      );
      return this.hydrateSingle(result.rows[0]);
    }, () => this.createInMemory(input));
  }

  async list(query?: { domain?: WorkflowDomain; includeInactive?: boolean }): Promise<WorkflowRecord[]> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const where: string[] = [];
      const params: unknown[] = [];

      if (query?.domain) {
        params.push(query.domain);
        where.push(`domain = $${params.length}`);
      }
      if (!query?.includeInactive) {
        where.push(`is_active = TRUE`);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const result = await this.postgresService.query<DbWorkflowRow>(
        `SELECT * FROM app_workflows ${whereClause} ORDER BY is_default DESC, updated_at DESC`,
        params,
      );
      return this.hydrateList(result.rows);
    }, () => this.listInMemory(query));
  }

  async getById(id: string): Promise<WorkflowRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbWorkflowRow>(
        `SELECT * FROM app_workflows WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Workflow configuration not found');
      }
      return this.hydrateSingle(result.rows[0]);
    }, () => {
      const workflow = this.memoryWorkflows.get(id);
      if (!workflow) {
        throw new NotFoundException('Workflow configuration not found');
      }
      return workflow;
    });
  }

  async getByCode(code: string): Promise<WorkflowRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const result = await this.postgresService.query<DbWorkflowRow>(
        `SELECT * FROM app_workflows WHERE code = $1 LIMIT 1`,
        [code],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException('Workflow configuration not found');
      }
      return this.hydrateSingle(result.rows[0]);
    }, () => {
      const workflow = Array.from(this.memoryWorkflows.values()).find((entry) => entry.code === code);
      if (!workflow) {
        throw new NotFoundException('Workflow configuration not found');
      }
      return workflow;
    });
  }

  async update(id: string, patch: UpdateWorkflowInput): Promise<WorkflowRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const existing = await this.getById(id);
      const result = await this.postgresService.query<DbWorkflowRow>(
        `UPDATE app_workflows
         SET name = $2,
             description = $3,
             is_active = $4,
             is_default = $5,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          patch.name ?? existing.name,
          patch.description ?? existing.description,
          patch.isActive ?? existing.isActive,
          patch.isDefault ?? existing.isDefault,
        ],
      );
      return this.hydrateSingle(result.rows[0]);
    }, async () => {
      const existing = await this.getById(id);
      const updated: WorkflowRecord = {
        ...existing,
        name: patch.name ?? existing.name,
        description: patch.description ?? existing.description,
        isActive: patch.isActive ?? existing.isActive,
        isDefault: patch.isDefault ?? existing.isDefault,
        updatedAt: new Date().toISOString(),
      };
      this.memoryWorkflows.set(id, updated);
      return updated;
    });
  }

  async clearDefaultByDomain(domain: WorkflowDomain): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      await this.postgresService.query(`UPDATE app_workflows SET is_default = FALSE WHERE domain = $1`, [domain]);
    }, () => {
      for (const [id, workflow] of this.memoryWorkflows.entries()) {
        if (workflow.domain !== domain || !workflow.isDefault) {
          continue;
        }
        this.memoryWorkflows.set(id, {
          ...workflow,
          isDefault: false,
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  async addStage(input: CreateWorkflowStageInput): Promise<WorkflowRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const now = new Date().toISOString();
      await this.postgresService.query(
        `INSERT INTO app_workflow_stages (
          id, workflow_id, stage_key, stage_name, approver_role, sort_order,
          require_only_one_approval, is_ordered, minimum_approvals, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          randomUUID(),
          input.workflowId,
          input.key,
          input.name,
          input.approverRole,
          input.sortOrder,
          input.requireOnlyOneApproval,
          input.isOrdered,
          input.minimumApprovals,
          now,
          now,
        ],
      );
      return this.getById(input.workflowId);
    }, async () => {
      const workflow = await this.getById(input.workflowId);
      const now = new Date().toISOString();
      const stage: WorkflowStageRecord = {
        id: randomUUID(),
        workflowId: input.workflowId,
        key: input.key,
        name: input.name,
        approverRole: input.approverRole,
        sortOrder: input.sortOrder,
        requireOnlyOneApproval: input.requireOnlyOneApproval,
        isOrdered: input.isOrdered,
        minimumApprovals: input.minimumApprovals,
        createdAt: now,
        updatedAt: now,
      };
      this.memoryWorkflows.set(workflow.id, {
        ...workflow,
        stages: [...workflow.stages, stage].sort((left, right) => left.sortOrder - right.sortOrder),
        updatedAt: now,
      });
      return this.getById(input.workflowId);
    });
  }

  async updateStage(workflowId: string, stageId: string, patch: UpdateWorkflowStageInput): Promise<WorkflowRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const row = await this.postgresService.query<DbWorkflowStageRow>(
        `SELECT * FROM app_workflow_stages WHERE id = $1 AND workflow_id = $2 LIMIT 1`,
        [stageId, workflowId],
      );
      if (row.rows.length === 0) {
        throw new NotFoundException('Workflow stage not found');
      }
      const existing = row.rows[0];
      await this.postgresService.query(
        `UPDATE app_workflow_stages
         SET stage_key = $3,
             stage_name = $4,
             approver_role = $5,
             require_only_one_approval = $6,
             is_ordered = $7,
             minimum_approvals = $8,
             updated_at = NOW()
         WHERE id = $1 AND workflow_id = $2`,
        [
          stageId,
          workflowId,
          patch.key ?? existing.stage_key,
          patch.name ?? existing.stage_name,
          patch.approverRole ?? existing.approver_role,
          patch.requireOnlyOneApproval ?? existing.require_only_one_approval,
          patch.isOrdered ?? existing.is_ordered,
          patch.minimumApprovals ?? existing.minimum_approvals,
        ],
      );
      return this.getById(workflowId);
    }, async () => {
      const workflow = await this.getById(workflowId);
      const stageExists = workflow.stages.some((stage) => stage.id === stageId);
      if (!stageExists) {
        throw new NotFoundException('Workflow stage not found');
      }
      const now = new Date().toISOString();
      this.memoryWorkflows.set(workflowId, {
        ...workflow,
        stages: workflow.stages.map((stage) =>
          stage.id === stageId
            ? {
                ...stage,
                key: patch.key ?? stage.key,
                name: patch.name ?? stage.name,
                approverRole: patch.approverRole ?? stage.approverRole,
                requireOnlyOneApproval: patch.requireOnlyOneApproval ?? stage.requireOnlyOneApproval,
                isOrdered: patch.isOrdered ?? stage.isOrdered,
                minimumApprovals: patch.minimumApprovals ?? stage.minimumApprovals,
                updatedAt: now,
              }
            : stage,
        ),
        updatedAt: now,
      });
      return this.getById(workflowId);
    });
  }

  async removeStage(workflowId: string, stageId: string): Promise<WorkflowRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      const deleted = await this.postgresService.query(
        `DELETE FROM app_workflow_stages WHERE workflow_id = $1 AND id = $2`,
        [workflowId, stageId],
      );
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Workflow stage not found');
      }
      const workflow = await this.getById(workflowId);
      return this.reorderStages(workflowId, workflow.stages.map((stage) => stage.id));
    }, async () => {
      const workflow = await this.getById(workflowId);
      const filtered = workflow.stages.filter((stage) => stage.id !== stageId);
      if (filtered.length === workflow.stages.length) {
        throw new NotFoundException('Workflow stage not found');
      }
      this.memoryWorkflows.set(workflowId, {
        ...workflow,
        stages: filtered.map((stage, index) => ({ ...stage, sortOrder: index + 1 })),
        updatedAt: new Date().toISOString(),
      });
      return this.getById(workflowId);
    });
  }

  async reorderStages(workflowId: string, stageIdsInOrder: string[]): Promise<WorkflowRecord> {
    return this.withFallback(async () => {
      await this.ensureSchema();
      await this.postgresService.query(
        `UPDATE app_workflow_stages
         SET sort_order = sort_order + 1000,
             updated_at = NOW()
         WHERE workflow_id = $1`,
        [workflowId],
      );

      for (let index = 0; index < stageIdsInOrder.length; index += 1) {
        await this.postgresService.query(
          `UPDATE app_workflow_stages
           SET sort_order = $3,
               updated_at = NOW()
           WHERE workflow_id = $1 AND id = $2`,
          [workflowId, stageIdsInOrder[index], index + 1],
        );
      }

      return this.getById(workflowId);
    }, async () => {
      const workflow = await this.getById(workflowId);
      const stageById = new Map(workflow.stages.map((stage) => [stage.id, stage]));
      const reordered = stageIdsInOrder.map((stageId, index) => {
        const stage = stageById.get(stageId);
        if (!stage) {
          throw new NotFoundException('Workflow stage not found');
        }
        return { ...stage, sortOrder: index + 1, updatedAt: new Date().toISOString() };
      });
      this.memoryWorkflows.set(workflowId, {
        ...workflow,
        stages: reordered,
        updatedAt: new Date().toISOString(),
      });
      return this.getById(workflowId);
    });
  }

  async remove(id: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureSchema();
      await this.postgresService.query(`DELETE FROM app_workflow_stages WHERE workflow_id = $1`, [id]);
      const deleted = await this.postgresService.query(`DELETE FROM app_workflows WHERE id = $1`, [id]);
      if (deleted.rowCount === 0) {
        throw new NotFoundException('Workflow configuration not found');
      }
    }, () => {
      if (!this.memoryWorkflows.delete(id)) {
        throw new NotFoundException('Workflow configuration not found');
      }
    });
  }

  private async ensureSchema(): Promise<void> {
    if (this.schemaEnsured || !this.postgresService.isEnabled) {
      return;
    }

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_workflows (
        id UUID PRIMARY KEY,
        code VARCHAR(120) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        domain VARCHAR(60) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `);

    await this.postgresService.query(`
      CREATE TABLE IF NOT EXISTS app_workflow_stages (
        id UUID PRIMARY KEY,
        workflow_id UUID NOT NULL REFERENCES app_workflows(id) ON DELETE CASCADE,
        stage_key VARCHAR(120) NOT NULL,
        stage_name VARCHAR(255) NOT NULL,
        approver_role VARCHAR(120) NOT NULL,
        sort_order INTEGER NOT NULL,
        require_only_one_approval BOOLEAN NOT NULL DEFAULT TRUE,
        is_ordered BOOLEAN NOT NULL DEFAULT TRUE,
        minimum_approvals INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT uq_app_workflow_stage_order UNIQUE (workflow_id, sort_order)
      )
    `);

    await this.postgresService.query(`CREATE INDEX IF NOT EXISTS idx_app_workflows_domain ON app_workflows(domain, is_active)`);
    await this.postgresService.query(
      `CREATE INDEX IF NOT EXISTS idx_app_workflow_stages_workflow ON app_workflow_stages(workflow_id, sort_order)`,
    );

    this.schemaEnsured = true;
  }

  private async hydrateSingle(row: DbWorkflowRow): Promise<WorkflowRecord> {
    const stages = await this.postgresService.query<DbWorkflowStageRow>(
      `SELECT * FROM app_workflow_stages WHERE workflow_id = $1 ORDER BY sort_order ASC`,
      [row.id],
    );
    return toWorkflowRecord(row, stages.rows);
  }

  private async hydrateList(rows: DbWorkflowRow[]): Promise<WorkflowRecord[]> {
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const stages = await this.postgresService.query<DbWorkflowStageRow>(
      `SELECT * FROM app_workflow_stages WHERE workflow_id = ANY($1::uuid[]) ORDER BY sort_order ASC`,
      [ids],
    );
    const stageByWorkflow = new Map<string, DbWorkflowStageRow[]>();
    for (const stage of stages.rows) {
      const list = stageByWorkflow.get(stage.workflow_id) ?? [];
      list.push(stage);
      stageByWorkflow.set(stage.workflow_id, list);
    }
    return rows.map((row) => toWorkflowRecord(row, stageByWorkflow.get(row.id) ?? []));
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

  private createInMemory(input: CreateWorkflowInput): WorkflowRecord {
    const now = new Date().toISOString();
    const workflow: WorkflowRecord = {
      id: randomUUID(),
      code: input.code,
      name: input.name,
      description: input.description,
      domain: input.domain,
      isActive: input.isActive,
      isDefault: input.isDefault,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      stages: [],
    };
    this.memoryWorkflows.set(workflow.id, workflow);
    return workflow;
  }

  private listInMemory(query?: { domain?: WorkflowDomain; includeInactive?: boolean }): WorkflowRecord[] {
    return Array.from(this.memoryWorkflows.values())
      .filter((workflow) => (query?.domain ? workflow.domain === query.domain : true))
      .filter((workflow) => (query?.includeInactive ? true : workflow.isActive))
      .sort((left, right) => {
        if (left.isDefault === right.isDefault) {
          return right.updatedAt.localeCompare(left.updatedAt);
        }
        return left.isDefault ? -1 : 1;
      });
  }
}

interface DbWorkflowRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  domain: WorkflowDomain;
  is_active: boolean;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DbWorkflowStageRow {
  id: string;
  workflow_id: string;
  stage_key: string;
  stage_name: string;
  approver_role: string;
  sort_order: number;
  require_only_one_approval: boolean;
  is_ordered: boolean;
  minimum_approvals: number;
  created_at: string;
  updated_at: string;
}

function toWorkflowRecord(row: DbWorkflowRow, stageRows: DbWorkflowStageRow[]): WorkflowRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    domain: row.domain,
    isActive: row.is_active,
    isDefault: row.is_default,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stages: stageRows.map((stage) => ({
      id: stage.id,
      workflowId: stage.workflow_id,
      key: stage.stage_key,
      name: stage.stage_name,
      approverRole: stage.approver_role,
      sortOrder: stage.sort_order,
      requireOnlyOneApproval: stage.require_only_one_approval,
      isOrdered: stage.is_ordered,
      minimumApprovals: stage.minimum_approvals,
      createdAt: stage.created_at,
      updatedAt: stage.updated_at,
    })),
  };
}
