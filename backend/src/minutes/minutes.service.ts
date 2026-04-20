import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SYSTEM_ROLES } from '../core/constants/roles.constants';
import { MeetingsService } from '../meetings/meetings.service';
import { AuditService } from '../audit/audit.service';
import { AttendeesRepository } from '../attendees/attendees.repository';
import { MotionsRepository } from '../motions/motions.repository';
import { VotesRepository } from '../votes/votes.repository';
import { UsersRepository } from '../users/users.repository';
import { type MinutesRecord, MinutesRepository } from './minutes.repository';
import type { CreateMinutesDto } from './dto/create-minutes.dto';
import type { UpdateMinutesDto } from './dto/update-minutes.dto';
import {
  createDefaultMinutesContent,
  ensureMinutesFinalizeReadiness,
  normalizeMinutesContent,
  type MinutesAttendanceEntry,
  type MinutesMotionEntry,
  type MinutesVoteEntry,
  type MinutesRecordedVoteEntry,
  type MotionOutcome,
  type VoteMethod,
} from './minutes-content';
import { NotificationsService } from '../notifications/notifications.service';
import { normalizePagination, toPaginatedResult, type PaginatedResult } from '../types/pagination';

@Injectable()
export class MinutesService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly minutesRepository: MinutesRepository,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly attendeesRepository: AttendeesRepository,
    private readonly motionsRepository: MotionsRepository,
    private readonly votesRepository: VotesRepository,
    private readonly usersRepository: UsersRepository,
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
      isInCamera: dto.isInCamera,
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

  list(meetingId?: string, isInCamera?: boolean): Promise<MinutesRecord[]> {
    return this.minutesRepository.list(meetingId, isInCamera);
  }

  async listPaged(input: {
    meetingId?: string;
    isInCamera?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<MinutesRecord>> {
    const allMinutes = await this.minutesRepository.list(input.meetingId, input.isInCamera);
    const pagination = normalizePagination(input.page, input.limit);
    const pagedMinutes = allMinutes.slice(pagination.offset, pagination.offset + pagination.limit);
    return toPaginatedResult(pagedMinutes, allMinutes.length, pagination.page, pagination.limit);
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
      richTextSummary: dto.richTextSummary ?? minutes.richTextSummary,
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
    if (minutes.status !== 'FINALIZED' && minutes.status !== 'ADOPTED') {
      throw new BadRequestException('Only finalized or adopted minutes can be published');
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

  async adopt(id: string, user: AuthenticatedUser): Promise<MinutesRecord> {
    const minutes = await this.minutesRepository.getById(id);
    if (minutes.status !== 'FINALIZED') {
      throw new BadRequestException('Only finalized minutes can be adopted');
    }

    const updated = await this.minutesRepository.update(id, {
      status: 'ADOPTED',
      adoptedAt: new Date().toISOString(),
      adoptedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'minutes.adopt',
      entityType: 'minutes',
      entityId: id,
    });

    return updated;
  }

  async autoPopulate(id: string, user: AuthenticatedUser): Promise<MinutesRecord> {
    const minutes = await this.minutesRepository.getById(id);
    if (minutes.status === 'PUBLISHED') {
      throw new BadRequestException('Published minutes cannot be auto-populated');
    }

    const [attendees, motions] = await Promise.all([
      this.attendeesRepository.listByMeeting(minutes.meetingId),
      this.motionsRepository.list(minutes.meetingId),
    ]);

    const userNameCache = new Map<string, string>();

    const attendanceEntries: MinutesAttendanceEntry[] = await Promise.all(
      attendees.map(async (a) => {
        const displayName = await this.getUserDisplayName(a.userId, userNameCache);
        return {
          id: a.id,
          personName: displayName,
          role: a.role,
          present: a.status === 'PRESENT' || a.status === 'LATE',
          arrivalAt: a.arrivedAt,
          departureAt: a.departedAt,
          notes: a.notes,
        };
      }),
    );

    const motionEntries: MinutesMotionEntry[] = motions.map((m) => ({
      id: m.id,
      agendaItemId: m.agendaItemId,
      title: m.title,
      outcome: this.mapMotionStatusToOutcome(m.status),
      voteId: undefined,
      notes: m.resultNote,
    }));

    const voteEntries = await Promise.all(
      motions.map(async (m) => {
        if (m.status === 'DRAFT') {
          return null;
        }
        const tally = await this.votesRepository.getTally(m.id);
        if (tally.totalVotes === 0) {
          return null;
        }
        const recordedVotes: MinutesRecordedVoteEntry[] = await Promise.all(
          tally.recordedVotes.map(async (v) => ({
            personName: await this.getUserDisplayName(v.councilMemberId, userNameCache),
            vote: this.mapVoteValueToChoice(v.voteValue),
          })),
        );
        const entry: MinutesVoteEntry = {
          id: m.id,
          motionId: m.id,
          method: 'RECORDED',
          yesCount: tally.yesCount,
          noCount: tally.noCount,
          abstainCount: tally.abstainCount,
          recordedVotes,
        };
        return entry;
      }),
    );

    const populated = normalizeMinutesContent({
      schemaVersion: 1,
      summary: minutes.contentJson.summary,
      attendance: attendanceEntries,
      motions: motionEntries,
      votes: voteEntries.filter((v): v is MinutesVoteEntry => v !== null),
      actionItems: minutes.contentJson.actionItems,
      notes: minutes.contentJson.notes,
    });

    const updated = await this.minutesRepository.update(id, { contentJson: populated });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'minutes.auto_populate',
      entityType: 'minutes',
      entityId: id,
      changesJson: {
        attendeeCount: attendanceEntries.length,
        motionCount: motionEntries.length,
      },
    });

    return updated;
  }

  async recordInCameraMinutes(meetingId: string, user: AuthenticatedUser): Promise<MinutesRecord> {
    const meetingExists = await this.meetingsService.exists(meetingId);
    if (!meetingExists) {
      throw new BadRequestException('Meeting does not exist for these in-camera minutes');
    }

    const existing = await this.minutesRepository.list(meetingId, true);
    if (existing.length > 0) {
      return existing[0];
    }

    const created = await this.minutesRepository.create({
      meetingId,
      minuteTakerUserId: user.id,
      contentJson: createDefaultMinutesContent(),
      isInCamera: true,
      createdBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'minutes.create_in_camera',
      entityType: 'minutes',
      entityId: created.id,
      changesJson: { meetingId },
    });

    return created;
  }

  private async getUserDisplayName(userId: string, cache: Map<string, string>): Promise<string> {
    if (cache.has(userId)) {
      return cache.get(userId)!;
    }
    const name = await this.usersRepository.getUserDisplayName(userId);
    cache.set(userId, name);
    return name;
  }

  private mapMotionStatusToOutcome(status: string): MotionOutcome {
    const map: Record<string, MotionOutcome> = {
      DRAFT: 'PENDING',
      LIVE: 'PENDING',
      CARRIED: 'CARRIED',
      DEFEATED: 'DEFEATED',
      WITHDRAWN: 'WITHDRAWN',
    };
    return map[status] ?? 'PENDING';
  }

  private mapVoteValueToChoice(value: string): 'YES' | 'NO' | 'ABSTAIN' {
    const map: Record<string, 'YES' | 'NO' | 'ABSTAIN'> = {
      YEA: 'YES',
      NAY: 'NO',
      ABSTAIN: 'ABSTAIN',
      ABSENT: 'ABSTAIN',
    };
    return map[value] ?? 'ABSTAIN';
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
