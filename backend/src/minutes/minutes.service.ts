import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SYSTEM_ROLES } from '../core/constants/roles.constants';
import { MeetingsService } from '../meetings/meetings.service';
import { AuditService } from '../audit/audit.service';
import { type MinutesRecord, MinutesRepository } from './minutes.repository';
import type { CreateMinutesDto } from './dto/create-minutes.dto';
import type { UpdateMinutesDto } from './dto/update-minutes.dto';
import {
  createDefaultMinutesContent,
  ensureMinutesFinalizeReadiness,
  normalizeMinutesContent,
} from './minutes-content';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MinutesService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly minutesRepository: MinutesRepository,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async create(dto: CreateMinutesDto, user: AuthenticatedUser): Promise<MinutesRecord> {
    const meetingExists = await this.meetingsService.exists(dto.meetingId);
    if (!meetingExists) {
      throw new BadRequestException('Meeting does not exist for these minutes');
    }

    const created = await this.minutesRepository.create({
      meetingId: dto.meetingId,
      minuteTakerUserId: user.id,
      contentJson: normalizeMinutesContent(dto.contentJson ?? createDefaultMinutesContent()),
      createdBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'minutes.create',
      entityType: 'minutes',
      entityId: created.id,
      changesJson: { meetingId: created.meetingId },
    });

    return created;
  }

  list(meetingId?: string): Promise<MinutesRecord[]> {
    return this.minutesRepository.list(meetingId);
  }

  getById(id: string): Promise<MinutesRecord> {
    return this.minutesRepository.getById(id);
  }

  async start(id: string, user: AuthenticatedUser): Promise<MinutesRecord> {
    const minutes = await this.minutesRepository.getById(id);
    if (minutes.status !== 'DRAFT') {
      throw new BadRequestException('Only draft minutes can be started');
    }

    const updated = await this.minutesRepository.update(id, {
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      minuteTakerUserId: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'minutes.start',
      entityType: 'minutes',
      entityId: id,
    });

    return updated;
  }

  async update(id: string, dto: UpdateMinutesDto, user: AuthenticatedUser): Promise<MinutesRecord> {
    const minutes = await this.minutesRepository.getById(id);
    if (minutes.status === 'PUBLISHED') {
      throw new BadRequestException('Published minutes cannot be edited');
    }

    const updated = await this.minutesRepository.update(id, {
      contentJson: normalizeMinutesContent(dto.contentJson ?? minutes.contentJson),
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'minutes.update',
      entityType: 'minutes',
      entityId: id,
      changesJson: { note: dto.note ?? 'Content updated' },
    });

    return updated;
  }

  async finalize(id: string, user: AuthenticatedUser): Promise<MinutesRecord> {
    const minutes = await this.minutesRepository.getById(id);
    if (minutes.status !== 'IN_PROGRESS' && minutes.status !== 'DRAFT') {
      throw new BadRequestException('Only draft or in-progress minutes can be finalized');
    }

    const issues = ensureMinutesFinalizeReadiness(minutes.contentJson);
    if (issues.length > 0) {
      throw new BadRequestException(issues.join(' '));
    }

    const updated = await this.minutesRepository.update(id, {
      status: 'FINALIZED',
      finalizedAt: new Date().toISOString(),
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'minutes.finalize',
      entityType: 'minutes',
      entityId: id,
    });
    await this.emitNotification({
      eventType: 'MINUTES_FINALIZED',
      entityType: 'minutes',
      entityId: id,
      actorUserId: user.id,
      payloadJson: { status: 'FINALIZED' },
    });

    return updated;
  }

  async publish(id: string, user: AuthenticatedUser): Promise<MinutesRecord> {
    if (!user.roles.includes(SYSTEM_ROLES.CAO) && !user.roles.includes(SYSTEM_ROLES.ADMIN)) {
      throw new ForbiddenException('CAO or Admin role required to publish minutes');
    }

    const minutes = await this.minutesRepository.getById(id);
    if (minutes.status !== 'FINALIZED') {
      throw new BadRequestException('Only finalized minutes can be published');
    }

    const updated = await this.minutesRepository.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'minutes.publish',
      entityType: 'minutes',
      entityId: id,
    });
    await this.emitNotification({
      eventType: 'MINUTES_PUBLISHED',
      entityType: 'minutes',
      entityId: id,
      actorUserId: user.id,
      payloadJson: { status: 'PUBLISHED' },
    });

    return updated;
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
      // notification failures should not block minutes workflow transitions
    }
  }
}
