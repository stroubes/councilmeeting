import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { AuditService } from '../audit/audit.service';
import { MeetingsService } from '../meetings/meetings.service';
import type { CreateMotionDto } from './dto/create-motion.dto';
import type { SetMotionOutcomeDto } from './dto/set-motion-outcome.dto';
import type { UpdateMotionDto } from './dto/update-motion.dto';
import { type MotionRecord, MotionsRepository } from './motions.repository';

@Injectable()
export class MotionsService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly motionsRepository: MotionsRepository,
    private readonly auditService: AuditService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async list(meetingId?: string): Promise<MotionRecord[]> {
    return this.motionsRepository.list(meetingId);
  }

  async getById(id: string): Promise<MotionRecord> {
    return this.motionsRepository.getById(id);
  }

  async create(dto: CreateMotionDto, user: AuthenticatedUser): Promise<MotionRecord> {
    const meetingExists = await this.meetingsService.exists(dto.meetingId);
    if (!meetingExists) {
      throw new BadRequestException('Meeting does not exist for this motion');
    }

    const created = await this.motionsRepository.create({
      meetingId: dto.meetingId,
      agendaItemId: dto.agendaItemId,
      title: dto.title,
      body: dto.body,
      moverUserId: dto.moverUserId ?? user.id,
      createdBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.create',
      entityType: 'motion',
      entityId: created.id,
      changesJson: { meetingId: created.meetingId },
    });
    return created;
  }

  async update(id: string, dto: UpdateMotionDto, user: AuthenticatedUser): Promise<MotionRecord> {
    const existing = await this.getById(id);
    const updated = await this.motionsRepository.update(id, {
      agendaItemId: dto.agendaItemId ?? existing.agendaItemId,
      title: dto.title ?? existing.title,
      body: dto.body ?? existing.body,
      updatedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.update',
      entityType: 'motion',
      entityId: id,
    });

    return updated;
  }

  async setLive(id: string, user: AuthenticatedUser): Promise<MotionRecord> {
    if (!user.permissions.includes(PERMISSIONS.MOTION_CALL)) {
      throw new ForbiddenException('Missing motion.call permission');
    }

    const motion = await this.getById(id);
    await this.motionsRepository.clearLiveByMeeting(motion.meetingId, user.id);

    const updated = await this.motionsRepository.update(id, {
      isCurrentLive: true,
      status: 'LIVE',
      liveAt: new Date().toISOString(),
      updatedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.set_live',
      entityType: 'motion',
      entityId: id,
      changesJson: { meetingId: motion.meetingId },
    });

    return updated;
  }

  async propose(id: string, user: AuthenticatedUser): Promise<MotionRecord> {
    if (!user.permissions.includes(PERMISSIONS.MOTION_PROPOSE)) {
      throw new ForbiddenException('Missing motion.propose permission');
    }

    const motion = await this.getById(id);

    if (motion.motionPhase !== 'PROPOSED') {
      throw new ForbiddenException(`Motion is in ${motion.motionPhase} phase — cannot re-propose`);
    }

    if (motion.moverUserId && motion.moverUserId !== user.id) {
      throw new ForbiddenException('Motion has already been proposed');
    }

    const updated = await this.motionsRepository.update(id, {
      moverUserId: user.id,
      updatedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.propose',
      entityType: 'motion',
      entityId: id,
    });

    return updated;
  }

  async second(id: string, user: AuthenticatedUser): Promise<MotionRecord> {
    if (!user.permissions.includes(PERMISSIONS.MOTION_SECOND)) {
      throw new ForbiddenException('Missing motion.second permission');
    }

    const motion = await this.getById(id);

    if (motion.motionPhase !== 'PROPOSED') {
      throw new ForbiddenException(`Motion is in ${motion.motionPhase} phase — cannot second`);
    }

    if (!motion.moverUserId) {
      throw new ForbiddenException('Motion has not been proposed yet');
    }

    if (motion.seconderUserId) {
      throw new ForbiddenException('Motion has already been seconded');
    }

    if (motion.moverUserId === user.id) {
      throw new ForbiddenException('Mover cannot second their own motion');
    }

    const updated = await this.motionsRepository.update(id, {
      seconderUserId: user.id,
      motionPhase: 'SECONDED',
      updatedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.second',
      entityType: 'motion',
      entityId: id,
    });

    return updated;
  }

  async openDebate(id: string, user: AuthenticatedUser): Promise<MotionRecord> {
    if (!user.permissions.includes(PERMISSIONS.MOTION_OPEN_DEBATE)) {
      throw new ForbiddenException('Missing motion.open_debate permission');
    }

    const motion = await this.getById(id);

    if (motion.motionPhase !== 'SECONDED') {
      throw new ForbiddenException(`Motion must be seconded before opening debate — currently in ${motion.motionPhase} phase`);
    }

    const updated = await this.motionsRepository.update(id, {
      motionPhase: 'DEBATING',
      updatedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.open_debate',
      entityType: 'motion',
      entityId: id,
    });

    return updated;
  }

  async closeDebate(id: string, user: AuthenticatedUser): Promise<MotionRecord> {
    if (!user.permissions.includes(PERMISSIONS.MOTION_CLOSE_DEBATE)) {
      throw new ForbiddenException('Missing motion.close_debate permission');
    }

    const motion = await this.getById(id);

    if (motion.motionPhase !== 'DEBATING') {
      throw new ForbiddenException(`Motion must be in DEBATING phase to close debate — currently in ${motion.motionPhase} phase`);
    }

    const updated = await this.motionsRepository.update(id, {
      motionPhase: 'CALLED',
      updatedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.close_debate',
      entityType: 'motion',
      entityId: id,
    });

    return updated;
  }

  async callVote(id: string, user: AuthenticatedUser): Promise<MotionRecord> {
    if (!user.permissions.includes(PERMISSIONS.MOTION_CALL)) {
      throw new ForbiddenException('Missing motion.call permission');
    }

    const motion = await this.getById(id);

    if (motion.motionPhase !== 'CALLED') {
      throw new ForbiddenException(`Motion must be in CALLED phase to call vote — currently in ${motion.motionPhase} phase`);
    }

    await this.motionsRepository.clearLiveByMeeting(motion.meetingId, user.id);

    const updated = await this.motionsRepository.update(id, {
      isCurrentLive: true,
      status: 'LIVE',
      liveAt: new Date().toISOString(),
      updatedBy: user.id,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.call_vote',
      entityType: 'motion',
      entityId: id,
      changesJson: { meetingId: motion.meetingId },
    });

    return updated;
  }

  async setOutcome(id: string, dto: SetMotionOutcomeDto, user: AuthenticatedUser): Promise<MotionRecord> {
    if (!user.permissions.includes(PERMISSIONS.MOTION_CALL)) {
      throw new ForbiddenException('Missing motion.call permission');
    }

    const motion = await this.getById(id);
    const updated = await this.motionsRepository.update(id, {
      status: dto.status,
      motionPhase: 'CALLED',
      resultNote: dto.resultNote,
      isCurrentLive: false,
      updatedBy: user.id,
    });

    if (motion.isCurrentLive) {
      await this.motionsRepository.clearLiveByMeeting(motion.meetingId, user.id);
    }

    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.set_outcome',
      entityType: 'motion',
      entityId: id,
      changesJson: { status: dto.status },
    });

    return updated;
  }

  async getCurrentLive(meetingId: string): Promise<MotionRecord | null> {
    return this.motionsRepository.getCurrentLiveByMeeting(meetingId);
  }

  async getPublicState(meetingId: string): Promise<{ liveMotion: MotionRecord | null; recentOutcomeMotion: MotionRecord | null }> {
    const motions = await this.motionsRepository.list(meetingId);
    const liveMotion = motions.find((motion) => motion.isCurrentLive) ?? null;
    const recentOutcomeMotion =
      motions
        .filter((motion) => motion.status === 'CARRIED' || motion.status === 'DEFEATED' || motion.status === 'WITHDRAWN')
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] ?? null;

    return {
      liveMotion,
      recentOutcomeMotion,
    };
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.motionsRepository.remove(id);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'motion.delete',
      entityType: 'motion',
      entityId: id,
    });
    return { ok: true };
  }
}
