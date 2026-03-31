import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { ActionsService } from '../actions/actions.service';
import type { CreateResolutionDto } from './dto/create-resolution.dto';
import type { UpdateResolutionDto } from './dto/update-resolution.dto';
import { type ResolutionRecord, ResolutionsRepository } from './resolutions.repository';

@Injectable()
export class ResolutionsService {
  constructor(
    private readonly resolutionsRepository: ResolutionsRepository,
    private readonly auditService: AuditService,
    private readonly actionsService: ActionsService,
  ) {}

  list(meetingId?: string): Promise<ResolutionRecord[]> {
    return this.resolutionsRepository.list(meetingId);
  }

  getById(id: string): Promise<ResolutionRecord> {
    return this.resolutionsRepository.getById(id);
  }

  async create(dto: CreateResolutionDto, user: AuthenticatedUser): Promise<ResolutionRecord> {
    const created = await this.resolutionsRepository.create({
      meetingId: dto.meetingId,
      agendaItemId: dto.agendaItemId,
      motionId: dto.motionId,
      resolutionNumber: dto.resolutionNumber.trim(),
      title: dto.title.trim(),
      body: dto.body.trim(),
      bylawNumber: dto.bylawNumber?.trim(),
      movedBy: dto.movedBy?.trim(),
      secondedBy: dto.secondedBy?.trim(),
      voteFor: dto.voteFor ?? 0,
      voteAgainst: dto.voteAgainst ?? 0,
      voteAbstain: dto.voteAbstain ?? 0,
      status: 'DRAFT',
      isActionRequired: dto.isActionRequired ?? false,
      dueDate: dto.dueDate,
      createdBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'resolution.create',
      entityType: 'resolution',
      entityId: created.id,
      changesJson: { resolutionNumber: created.resolutionNumber, meetingId: created.meetingId },
    });
    return created;
  }

  async update(id: string, dto: UpdateResolutionDto, user: AuthenticatedUser): Promise<ResolutionRecord> {
    const existing = await this.getById(id);
    const updated = await this.resolutionsRepository.update(id, {
      title: dto.title?.trim(),
      body: dto.body?.trim(),
      bylawNumber: dto.bylawNumber?.trim(),
      movedBy: dto.movedBy?.trim(),
      secondedBy: dto.secondedBy?.trim(),
      voteFor: dto.voteFor,
      voteAgainst: dto.voteAgainst,
      voteAbstain: dto.voteAbstain,
      status: dto.status,
      isActionRequired: dto.isActionRequired,
      dueDate: dto.dueDate,
    });

    if (existing.status !== 'ADOPTED' && updated.status === 'ADOPTED' && updated.isActionRequired) {
      await this.actionsService.create(
        {
          title: `Follow-up: ${updated.title}`,
          description: `Action item generated from adopted resolution ${updated.resolutionNumber}.`,
          dueDate: updated.dueDate,
          meetingId: updated.meetingId,
          resolutionId: updated.id,
          priority: 'MEDIUM',
        },
        user,
      );
    }

    await this.auditService.log({
      actorUserId: user.id,
      action: 'resolution.update',
      entityType: 'resolution',
      entityId: id,
    });
    return updated;
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.resolutionsRepository.remove(id);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'resolution.delete',
      entityType: 'resolution',
      entityId: id,
    });
    return { ok: true };
  }

  async exportPacket(meetingId: string): Promise<{ meetingId: string; generatedAt: string; rows: ResolutionRecord[]; sheet: string }> {
    const rows = await this.list(meetingId);
    const sheet = rows
      .map((row) => {
        const vote = `${row.voteFor}-${row.voteAgainst}-${row.voteAbstain}`;
        return `${row.resolutionNumber}\t${row.title}\t${row.status}\t${vote}\t${row.bylawNumber ?? ''}`;
      })
      .join('\n');

    return {
      meetingId,
      generatedAt: new Date().toISOString(),
      rows,
      sheet,
    };
  }
}
