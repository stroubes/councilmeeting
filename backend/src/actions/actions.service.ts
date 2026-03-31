import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { type ActionItemRecord, ActionsRepository } from './actions.repository';
import type { CreateActionItemDto } from './dto/create-action-item.dto';
import type { UpdateActionItemDto } from './dto/update-action-item.dto';

@Injectable()
export class ActionsService {
  constructor(
    private readonly actionsRepository: ActionsRepository,
    private readonly auditService: AuditService,
  ) {}

  list(query?: { status?: string; ownerUserId?: string }): Promise<ActionItemRecord[]> {
    return this.actionsRepository.list({
      status: query?.status as ActionItemRecord['status'],
      ownerUserId: query?.ownerUserId,
    });
  }

  getById(id: string): Promise<ActionItemRecord> {
    return this.actionsRepository.getById(id);
  }

  async create(dto: CreateActionItemDto, user: AuthenticatedUser): Promise<ActionItemRecord> {
    const created = await this.actionsRepository.create({
      title: dto.title.trim(),
      description: dto.description?.trim(),
      status: 'OPEN',
      priority: dto.priority ?? 'MEDIUM',
      ownerUserId: dto.ownerUserId,
      dueDate: dto.dueDate,
      meetingId: dto.meetingId,
      resolutionId: dto.resolutionId,
      motionId: dto.motionId,
      createdBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'action_item.create',
      entityType: 'action_item',
      entityId: created.id,
    });
    return created;
  }

  async update(id: string, dto: UpdateActionItemDto, user: AuthenticatedUser): Promise<ActionItemRecord> {
    const updated = await this.actionsRepository.update(id, {
      title: dto.title?.trim(),
      description: dto.description?.trim(),
      status: dto.status,
      priority: dto.priority,
      ownerUserId: dto.ownerUserId,
      dueDate: dto.dueDate,
      completedAt: dto.status === 'COMPLETED' ? new Date().toISOString() : undefined,
    });
    await this.auditService.log({
      actorUserId: user.id,
      action: 'action_item.update',
      entityType: 'action_item',
      entityId: id,
    });
    return updated;
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.actionsRepository.remove(id);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'action_item.delete',
      entityType: 'action_item',
      entityId: id,
    });
    return { ok: true };
  }

  async dashboard(): Promise<{
    open: number;
    inProgress: number;
    blocked: number;
    overdue: number;
    completed: number;
  }> {
    const items = await this.actionsRepository.list();
    const now = Date.now();
    return {
      open: items.filter((item) => item.status === 'OPEN').length,
      inProgress: items.filter((item) => item.status === 'IN_PROGRESS').length,
      blocked: items.filter((item) => item.status === 'BLOCKED').length,
      overdue: items.filter((item) => item.dueDate && new Date(item.dueDate).getTime() < now && item.status !== 'COMPLETED').length,
      completed: items.filter((item) => item.status === 'COMPLETED').length,
    };
  }
}
