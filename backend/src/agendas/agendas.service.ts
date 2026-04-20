import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SYSTEM_ROLES } from '../core/constants/roles.constants';
import type { CreateAgendaDto } from './dto/create-agenda.dto';
import type { RejectAgendaDto } from './dto/reject-agenda.dto';
import type { UpdateAgendaDto } from './dto/update-agenda.dto';
import type { CreateAgendaItemDto } from './items/dto/create-agenda-item.dto';
import type { ReorderAgendaItemsDto } from './items/dto/reorder-agenda-items.dto';
import type { UpdateAgendaItemDto } from './items/dto/update-agenda-item.dto';
import { AgendasRepository } from './agendas.repository';
import { MeetingsService } from '../meetings/meetings.service';
import { AuditService } from '../audit/audit.service';
import { TemplatesService } from '../templates/templates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GovernanceService } from '../governance/governance.service';
import { inferAgendaTemplateProfile } from '../governance/municipal-profile.constants';
import { MeetingTypesService } from '../meeting-types/meeting-types.service';
import { normalizePagination, toPaginatedResult, type PaginatedResult } from '../types/pagination';
import type { BulkAgendaActionDto } from './dto/bulk-agenda-action.dto';

export type AgendaStatus =
  | 'DRAFT'
  | 'PENDING_DIRECTOR_APPROVAL'
  | 'PENDING_CAO_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

type AgendaItemStatus =
  | 'DRAFT'
  | 'PENDING_DIRECTOR_APPROVAL'
  | 'PENDING_CAO_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

export interface AgendaItemRecord {
  id: string;
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
  status: AgendaItemStatus;
  bylawId?: string;
  itemNumber?: string;
  publishStatus: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaRecord {
  id: string;
  meetingId: string;
  templateId?: string;
  title: string;
  status: AgendaStatus;
  version: number;
  rejectionReason?: string;
  items: AgendaItemRecord[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

@Injectable()
export class AgendasService {
  constructor(
    private readonly agendasRepository: AgendasRepository,
    private readonly meetingsService: MeetingsService,
    private readonly auditService: AuditService,
    private readonly templatesService: TemplatesService,
    private readonly notificationsService: NotificationsService,
    private readonly governanceService: GovernanceService,
    private readonly meetingTypesService: MeetingTypesService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async create(dto: CreateAgendaDto, user: AuthenticatedUser): Promise<AgendaRecord> {
    const meetingExists = await this.meetingsService.exists(dto.meetingId);
    if (!meetingExists) {
      throw new BadRequestException('Meeting does not exist for this agenda');
    }

    const meeting = await this.meetingsService.getById(dto.meetingId, user);
    const meetingType = await this.meetingTypesService.getByCode(meeting.meetingTypeCode);
    const resolvedTemplateId = dto.templateId ?? meetingType.wizardConfig?.defaultAgendaTemplateId;

    const template = resolvedTemplateId ? await this.templatesService.getById(resolvedTemplateId) : null;
    if (template && template.type !== 'AGENDA') {
      throw new BadRequestException('Selected template must be an agenda template');
    }

    const created = await this.agendasRepository.create({
      meetingId: dto.meetingId,
      templateId: resolvedTemplateId,
      title: dto.title,
      createdBy: user.id,
    });

    if (template) {
      const sortedSections = [...template.sections].sort((left, right) => left.sortOrder - right.sortOrder);
      for (let index = 0; index < sortedSections.length; index += 1) {
        const section = sortedSections[index];
        await this.agendasRepository.addItem({
          agendaId: created.id,
          itemType: section.itemType ?? 'SECTION',
          title: section.title,
          description: section.description,
          parentItemId: undefined,
          isInCamera: false,
          isPublicVisible: true,
          publishAt: undefined,
          redactionNote: undefined,
          carryForwardToNext: false,
          sortOrder: index + 1,
          status: 'DRAFT',
          createdBy: user.id,
        });
      }
      await this.agendasRepository.update(created.id, { version: created.version + 1 });
    }

    if (meetingType.standingItems?.length) {
      let sortOrder = (await this.getById(created.id)).items.length + 1;
      for (const standingItem of meetingType.standingItems) {
        await this.agendasRepository.addItem({
          agendaId: created.id,
          itemType: standingItem.itemType,
          title: standingItem.title,
          description: standingItem.description,
          parentItemId: undefined,
          isInCamera: standingItem.isInCamera ?? false,
          isPublicVisible: !(standingItem.isInCamera ?? false),
          publishAt: undefined,
          redactionNote: undefined,
          carryForwardToNext: standingItem.carryForwardToNext ?? false,
          sortOrder,
          status: 'DRAFT',
          createdBy: user.id,
        });
        sortOrder += 1;
      }
    }

    await this.auditService.log({
      actorUserId: user.id,
      action: 'agenda.create',
      entityType: 'agenda',
      entityId: created.id,
    });

    return this.getById(created.id);
  }

  list(meetingId?: string): Promise<AgendaRecord[]> {
    return this.agendasRepository.list(meetingId);
  }

  async listPaged(input: { meetingId?: string; page?: number; limit?: number }): Promise<PaginatedResult<AgendaRecord>> {
    const allAgendas = await this.agendasRepository.list(input.meetingId);
    const pagination = normalizePagination(input.page, input.limit);
    const pagedAgendas = allAgendas.slice(pagination.offset, pagination.offset + pagination.limit);
    return toPaginatedResult(pagedAgendas, allAgendas.length, pagination.page, pagination.limit);
  }

  getById(id: string): Promise<AgendaRecord> {
    return this.agendasRepository.getById(id);
  }

  async update(id: string, dto: UpdateAgendaDto): Promise<AgendaRecord> {
    const existing = await this.getById(id);
    if (existing.status === 'PUBLISHED') {
      throw new BadRequestException('Published agenda cannot be edited');
    }

    const updated = await this.agendasRepository.update(id, {
      title: dto.title ?? existing.title,
      version: existing.version + 1,
    });

    await this.auditService.log({
      action: 'agenda.update',
      entityType: 'agenda',
      entityId: updated.id,
      changesJson: { title: dto.title },
    });

    return updated;
  }

  async addItem(agendaId: string, dto: CreateAgendaItemDto, user: AuthenticatedUser): Promise<AgendaRecord> {
    const agenda = await this.getById(agendaId);
    if (agenda.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot add items to published agenda');
    }

    await this.agendasRepository.addItem({
      agendaId,
      itemType: dto.itemType,
      title: dto.title,
      description: dto.description,
      parentItemId: dto.parentItemId,
      isInCamera: dto.isInCamera ?? false,
      isPublicVisible: dto.isPublicVisible ?? !(dto.isInCamera ?? false),
      publishAt: dto.publishAt,
      redactionNote: dto.redactionNote,
      carryForwardToNext: dto.carryForwardToNext ?? false,
      sortOrder: agenda.items.length + 1,
      status: 'DRAFT',
      bylawId: dto.bylawId,
      createdBy: user.id,
    });

    const updated = await this.agendasRepository.update(agenda.id, {
      version: agenda.version + 1,
    });

    await this.saveAgendaSnapshot(agenda.id, updated.version, `Added item: ${dto.title}`, user.id);
    await this.recomputeItemNumbers(agenda.id);

    return this.getById(agenda.id);
  }

  async updateItem(agendaId: string, itemId: string, dto: UpdateAgendaItemDto): Promise<AgendaRecord> {
    const agenda = await this.getById(agendaId);
    const item = agenda.items.find((candidate) => candidate.id === itemId);

    if (!item) {
      throw new NotFoundException('Agenda item not found');
    }
    if (agenda.status === 'PUBLISHED' || item.status === 'PUBLISHED') {
      throw new BadRequestException('Published agenda item cannot be edited');
    }

    await this.agendasRepository.updateItem(agendaId, itemId, {
      title: dto.title,
      description: dto.description,
      isInCamera: dto.isInCamera,
      isPublicVisible: dto.isPublicVisible,
      publishAt: dto.publishAt,
      redactionNote: dto.redactionNote,
      carryForwardToNext: dto.carryForwardToNext,
      bylawId: dto.bylawId,
      itemNumber: dto.itemNumber,
    });

    const updated = await this.agendasRepository.update(agenda.id, { version: agenda.version + 1 });
    await this.auditService.log({
      action: 'agenda.item.update',
      entityType: 'agenda',
      entityId: agenda.id,
      changesJson: { itemId },
    });
    await this.saveAgendaSnapshot(agenda.id, updated.version, `Updated item: ${item.title}`, undefined);
    if (dto.itemNumber === undefined) {
      await this.recomputeItemNumbers(agenda.id);
    }
    return this.getById(agenda.id);
  }

  async reorderItems(agendaId: string, dto: ReorderAgendaItemsDto): Promise<AgendaRecord> {
    const agenda = await this.getById(agendaId);
    if (agenda.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot reorder items on published agenda');
    }

    if (dto.itemIdsInOrder.length !== agenda.items.length) {
      throw new BadRequestException('Reorder payload must include all agenda items');
    }

    const itemsById = new Map(agenda.items.map((item) => [item.id, item]));
    const reordered: AgendaItemRecord[] = dto.itemIdsInOrder.map((itemId, index) => {
      const item = itemsById.get(itemId);
      if (!item) {
        throw new NotFoundException(`Agenda item ${itemId} not found`);
      }
      item.sortOrder = index + 1;
      item.updatedAt = new Date().toISOString();
      return item;
    });

    await this.agendasRepository.replaceItems(agenda.id, reordered);
    const updated = await this.agendasRepository.update(agenda.id, { version: agenda.version + 1 });
    await this.auditService.log({
      action: 'agenda.items.reorder',
      entityType: 'agenda',
      entityId: agenda.id,
    });
    await this.recomputeItemNumbers(agenda.id);
    return this.getById(agenda.id);
  }

  async removeItem(agendaId: string, itemId: string): Promise<AgendaRecord> {
    const agenda = await this.getById(agendaId);
    if (agenda.status === 'PUBLISHED') {
      throw new BadRequestException('Cannot remove items from published agenda');
    }

    const removedItem = agenda.items.find((item) => item.id === itemId);
    const remainingItems = agenda.items.filter((item) => item.id !== itemId);
    if (remainingItems.length === agenda.items.length) {
      throw new NotFoundException('Agenda item not found');
    }

    const now = new Date().toISOString();
    const reordered = remainingItems
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item, index) => ({
        ...item,
        sortOrder: index + 1,
        updatedAt: now,
      }));

    await this.agendasRepository.replaceItems(agenda.id, reordered);
    const updated = await this.agendasRepository.update(agenda.id, { version: agenda.version + 1 });
    await this.auditService.log({
      action: 'agenda.item.delete',
      entityType: 'agenda',
      entityId: agenda.id,
      changesJson: { itemId },
    });
    await this.saveAgendaSnapshot(agenda.id, updated.version, `Removed item: ${removedItem?.title ?? itemId}`, undefined);
    await this.recomputeItemNumbers(agenda.id);
    return this.getById(agenda.id);
  }

  async submitForDirector(agendaId: string): Promise<AgendaRecord> {
    const agenda = await this.getById(agendaId);
    this.ensureStatus(agenda.status, ['DRAFT', 'REJECTED']);

    const readinessIssues = await this.getSubmissionIssues(agenda);
    if (readinessIssues.length > 0) {
      const profile = await this.governanceService.getActiveProfile();
      throw new BadRequestException({
        message: 'Agenda package is not ready for submission.',
        profile: profile.id,
        issues: readinessIssues,
      });
    }

    const items = agenda.items.map((item) => ({
      ...item,
      status: 'PENDING_DIRECTOR_APPROVAL' as AgendaStatus,
      updatedAt: new Date().toISOString(),
    }));
    const updated = await this.agendasRepository.transitionWorkflowState({
      agendaId: agenda.id,
      expectedUpdatedAt: agenda.updatedAt,
      agendaPatch: {
        status: 'PENDING_DIRECTOR_APPROVAL',
        version: agenda.version + 1,
        rejectionReason: undefined,
      },
      items,
    });
    await this.auditService.log({
      action: 'agenda.submit_director',
      entityType: 'agenda',
      entityId: agenda.id,
    });
    await this.emitNotification({
      eventType: 'AGENDA_SUBMITTED',
      entityType: 'agenda',
      entityId: agenda.id,
      payloadJson: { status: updated.status },
    });
    return updated;
  }

  async approveByDirector(agendaId: string, user: AuthenticatedUser): Promise<AgendaRecord> {
    if (!user.roles.includes(SYSTEM_ROLES.DIRECTOR) && !user.roles.includes(SYSTEM_ROLES.ADMIN)) {
      throw new ForbiddenException('Director role is required');
    }

    const agenda = await this.getById(agendaId);
    this.ensureStatus(agenda.status, ['PENDING_DIRECTOR_APPROVAL']);
    const items = agenda.items.map((item) => ({
      ...item,
      status: 'PENDING_CAO_APPROVAL' as AgendaStatus,
      updatedAt: new Date().toISOString(),
    }));
    const updated = await this.agendasRepository.transitionWorkflowState({
      agendaId: agenda.id,
      expectedUpdatedAt: agenda.updatedAt,
      agendaPatch: {
        status: 'PENDING_CAO_APPROVAL',
        version: agenda.version + 1,
      },
      items,
    });
    await this.auditService.log({
      actorUserId: user.id,
      action: 'agenda.approve_director',
      entityType: 'agenda',
      entityId: agenda.id,
    });
    await this.emitNotification({
      eventType: 'AGENDA_APPROVED_DIRECTOR',
      entityType: 'agenda',
      entityId: agenda.id,
      actorUserId: user.id,
      payloadJson: { status: updated.status },
    });
    return updated;
  }

  async approveByCao(agendaId: string, user: AuthenticatedUser): Promise<AgendaRecord> {
    if (!user.roles.includes(SYSTEM_ROLES.CAO) && !user.roles.includes(SYSTEM_ROLES.ADMIN)) {
      throw new ForbiddenException('CAO role is required');
    }

    const agenda = await this.getById(agendaId);
    this.ensureStatus(agenda.status, ['PENDING_CAO_APPROVAL']);
    const items = agenda.items.map((item) => ({
      ...item,
      status: 'APPROVED' as AgendaStatus,
      updatedAt: new Date().toISOString(),
    }));
    const updated = await this.agendasRepository.transitionWorkflowState({
      agendaId: agenda.id,
      expectedUpdatedAt: agenda.updatedAt,
      agendaPatch: {
        status: 'APPROVED',
        version: agenda.version + 1,
      },
      items,
    });
    await this.auditService.log({
      actorUserId: user.id,
      action: 'agenda.approve_cao',
      entityType: 'agenda',
      entityId: agenda.id,
    });
    await this.emitNotification({
      eventType: 'AGENDA_APPROVED_CAO',
      entityType: 'agenda',
      entityId: agenda.id,
      actorUserId: user.id,
      payloadJson: { status: updated.status },
    });
    return updated;
  }

  async reject(agendaId: string, user: AuthenticatedUser, dto: RejectAgendaDto): Promise<AgendaRecord> {
    if (
      !user.roles.includes(SYSTEM_ROLES.DIRECTOR) &&
      !user.roles.includes(SYSTEM_ROLES.CAO) &&
      !user.roles.includes(SYSTEM_ROLES.ADMIN)
    ) {
      throw new ForbiddenException('Approver role is required');
    }

    const agenda = await this.getById(agendaId);
    this.ensureStatus(agenda.status, ['PENDING_DIRECTOR_APPROVAL', 'PENDING_CAO_APPROVAL']);
    const items = agenda.items.map((item) => ({
      ...item,
      status: 'REJECTED' as AgendaStatus,
      updatedAt: new Date().toISOString(),
    }));
    const updated = await this.agendasRepository.transitionWorkflowState({
      agendaId: agenda.id,
      expectedUpdatedAt: agenda.updatedAt,
      agendaPatch: {
        status: 'REJECTED',
        version: agenda.version + 1,
        rejectionReason: dto.reason,
      },
      items,
    });
    await this.auditService.log({
      actorUserId: user.id,
      action: 'agenda.reject',
      entityType: 'agenda',
      entityId: agenda.id,
      changesJson: { reason: dto.reason },
    });
    await this.emitNotification({
      eventType: 'AGENDA_REJECTED',
      entityType: 'agenda',
      entityId: agenda.id,
      actorUserId: user.id,
      payloadJson: { status: updated.status, reason: dto.reason },
    });
    return updated;
  }

  async publish(agendaId: string): Promise<AgendaRecord> {
    const agenda = await this.getById(agendaId);
    this.ensureStatus(agenda.status, ['APPROVED']);

    const readinessIssues = await this.getSubmissionIssues(agenda);
    if (readinessIssues.length > 0) {
      const profile = await this.governanceService.getActiveProfile();
      throw new BadRequestException({
        message: 'Agenda package is missing required municipal policy sections.',
        profile: profile.id,
        issues: readinessIssues,
      });
    }

    const now = new Date().toISOString();
    const items = agenda.items.map((item) => {
      const canPublishNow = item.isPublicVisible && (!item.publishAt || new Date(item.publishAt).getTime() <= Date.now());
      return {
        ...item,
        status: canPublishNow ? ('PUBLISHED' as AgendaStatus) : ('APPROVED' as AgendaStatus),
        description: item.redactionNote ? undefined : item.description,
        updatedAt: now,
      };
    });
    const updated = await this.agendasRepository.transitionWorkflowState({
      agendaId: agenda.id,
      expectedUpdatedAt: agenda.updatedAt,
      agendaPatch: {
        status: 'PUBLISHED',
        version: agenda.version + 1,
        publishedAt: now,
      },
      items,
    });
    await this.auditService.log({
      action: 'agenda.publish',
      entityType: 'agenda',
      entityId: agenda.id,
    });
    await this.emitNotification({
      eventType: 'AGENDA_PUBLISHED',
      entityType: 'agenda',
      entityId: agenda.id,
      payloadJson: { status: updated.status, publishedAt: now },
    });
    await this.saveAgendaSnapshot(agenda.id, updated.version, 'Agenda published', undefined);
    return updated;
  }

  async publishItem(agendaId: string, itemId: string): Promise<AgendaRecord> {
    const agenda = await this.getById(agendaId);
    const item = agenda.items.find((candidate) => candidate.id === itemId);
    if (!item) {
      throw new NotFoundException('Agenda item not found');
    }
    if (agenda.status !== 'PUBLISHED') {
      throw new BadRequestException('Agenda must be published before individual items can be published');
    }

    await this.agendasRepository.updateItem(agendaId, itemId, {
      publishStatus: 'PUBLISHED',
    } as any);

    const updated = await this.agendasRepository.update(agenda.id, { version: agenda.version + 1 });
    await this.auditService.log({
      action: 'agenda.item.publish',
      entityType: 'agenda',
      entityId: agenda.id,
      changesJson: { itemId },
    });
    return this.getById(agenda.id);
  }

  async unpublishItem(agendaId: string, itemId: string): Promise<AgendaRecord> {
    const agenda = await this.getById(agendaId);
    const item = agenda.items.find((candidate) => candidate.id === itemId);
    if (!item) {
      throw new NotFoundException('Agenda item not found');
    }

    await this.agendasRepository.updateItem(agendaId, itemId, {
      publishStatus: 'HIDDEN',
    } as any);

    const updated = await this.agendasRepository.update(agenda.id, { version: agenda.version + 1 });
    await this.auditService.log({
      action: 'agenda.item.unpublish',
      entityType: 'agenda',
      entityId: agenda.id,
      changesJson: { itemId },
    });
    return this.getById(agenda.id);
  }

  async carryForwardItems(sourceAgendaId: string, targetAgendaId: string, user: AuthenticatedUser): Promise<AgendaRecord> {
    const [source, target] = await Promise.all([this.getById(sourceAgendaId), this.getById(targetAgendaId)]);
    let sortOrder = target.items.length + 1;
    for (const item of source.items.filter((entry) => entry.carryForwardToNext)) {
      await this.agendasRepository.addItem({
        agendaId: target.id,
        itemType: item.itemType,
        title: item.title,
        description: item.description,
        parentItemId: undefined,
        isInCamera: item.isInCamera,
        isPublicVisible: item.isPublicVisible,
        publishAt: item.publishAt,
        redactionNote: item.redactionNote,
        carryForwardToNext: item.carryForwardToNext,
        sortOrder,
        status: 'DRAFT',
        createdBy: user.id,
      });
      sortOrder += 1;
    }
    await this.agendasRepository.update(target.id, { version: target.version + 1 });
    return this.getById(target.id);
  }

  hasAgendaItem(itemId: string): Promise<boolean> {
    return this.agendasRepository.hasAgendaItem(itemId);
  }

  async runScheduledPublicationSweep(runAt = new Date()): Promise<{ scanned: number; published: number; runAt: string }> {
    const agendas = await this.agendasRepository.list();
    let published = 0;
    const dueTimestamp = runAt.getTime();

    for (const agenda of agendas.filter((entry) => entry.status === 'PUBLISHED')) {
      for (const item of agenda.items) {
        const isAlreadyPublished = item.publishStatus === 'PUBLISHED';
        const canPublishNow = item.isPublicVisible && (!item.publishAt || new Date(item.publishAt).getTime() <= dueTimestamp);
        if (!isAlreadyPublished && canPublishNow) {
          await this.agendasRepository.updateItem(agenda.id, item.id, { status: 'PUBLISHED' });
          published += 1;
        }
      }
    }

    return {
      scanned: agendas.length,
      published,
      runAt: runAt.toISOString(),
    };
  }

  async runBulkAction(
    dto: BulkAgendaActionDto,
    user: AuthenticatedUser,
  ): Promise<{ requested: number; succeeded: number; failed: Array<{ agendaId: string; reason: string }> }> {
    const failures: Array<{ agendaId: string; reason: string }> = [];
    let succeeded = 0;

    for (const agendaId of dto.agendaIds) {
      try {
        if (dto.action === 'SUBMIT') {
          await this.submitForDirector(agendaId);
        } else {
          await this.publish(agendaId);
        }
        succeeded += 1;
      } catch (caughtError) {
        failures.push({
          agendaId,
          reason: caughtError instanceof Error ? caughtError.message : 'Agenda bulk action failed',
        });
      }
    }

    await this.auditService.log({
      actorUserId: user.id,
      action: 'agenda.bulk_action',
      entityType: 'agenda',
      entityId: dto.agendaIds.join(','),
      changesJson: {
        action: dto.action,
        requested: dto.agendaIds.length,
        succeeded,
        failed: failures.length,
      },
    });

    return {
      requested: dto.agendaIds.length,
      succeeded,
      failed: failures,
    };
  }

  getVersionHistory(agendaId: string): Promise<unknown[]> {
    return this.agendasRepository.getAgendaVersionHistory(agendaId);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.agendasRepository.remove(id);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'agenda.delete',
      entityType: 'agenda',
      entityId: id,
    });
    return { ok: true };
  }

  private ensureStatus(current: AgendaStatus, allowed: AgendaStatus[]): void {
    if (!allowed.includes(current)) {
      throw new BadRequestException(
        `Invalid workflow transition from ${current}. Allowed: ${allowed.join(', ')}`,
      );
    }
  }

  private async getSubmissionIssues(agenda: AgendaRecord): Promise<string[]> {
    const issues: string[] = [];
    const policyPack = await this.governanceService.getPolicyPack();

    if (agenda.items.length === 0) {
      issues.push('Add at least one agenda item before submitting.');
      return issues;
    }

    if (policyPack.closedSession.requiresReason) {
      const hasInCameraItems = agenda.items.some((item) => item.isInCamera);
      const hasClosedAuthorityItem = agenda.items.some((item) =>
        item.title.toLowerCase().includes('closed session authority'),
      );
      if (hasInCameraItems && !hasClosedAuthorityItem) {
        issues.push('In-camera content requires a "Closed Session Authority" agenda item.');
      }
    }

    if (!agenda.templateId) {
      return issues;
    }

    const template = await this.templatesService.getById(agenda.templateId);
    if (template.type !== 'AGENDA') {
      return issues;
    }

    const profile = inferAgendaTemplateProfile(template);
    const requiredTitles = policyPack.agendaTemplates[profile].requiredSectionTitles;
    const agendaTitles = new Set(agenda.items.map((item) => this.normalizeTitle(item.title)));

    for (const requiredTitle of requiredTitles) {
      const normalized = this.normalizeTitle(requiredTitle);
      if (!agendaTitles.has(normalized)) {
        issues.push(`Missing required section: ${requiredTitle}.`);
      }
    }

    return issues;
  }

  private normalizeTitle(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private async emitNotification(input: {
    eventType: string;
    entityType: string;
    entityId: string;
    actorUserId?: string;
    payloadJson?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.notificationsService.emit(input);
    } catch {
      // notification failures should not block governance workflow transitions
    }
  }

  private async saveAgendaSnapshot(agendaId: string, version: number, changeSummary: string, changedBy?: string): Promise<void> {
    try {
      const agenda = await this.agendasRepository.getById(agendaId);
      await this.agendasRepository.saveVersionSnapshot({
        agendaId,
        version,
        title: agenda.title,
        status: agenda.status,
        snapshotJson: {
          items: agenda.items,
          changeSummary,
          savedAt: new Date().toISOString(),
        },
        changedBy,
      });
    } catch {
      // snapshot failures must not block agenda operations
    }
  }

  private async recomputeItemNumbers(agendaId: string): Promise<void> {
    try {
      const agenda = await this.agendasRepository.getById(agendaId);
      const sorted = [...agenda.items].sort((a, b) => a.sortOrder - b.sortOrder);
      let counter = 0;
      for (const item of sorted) {
        counter += 1;
        const itemNumber = `${counter}.`;
        if (item.itemNumber !== itemNumber) {
          await this.agendasRepository.updateItem(agendaId, item.id, { itemNumber });
        }
      }
    } catch {
      // numbering failures must not block agenda operations
    }
  }
}
