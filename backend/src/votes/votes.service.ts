import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ConflictDeclarationsRepository } from '../conflict-declarations/conflict-declarations.repository';
import { MotionsService } from '../motions/motions.service';
import type { CastVoteDto, UpdateVoteDto } from './dto/cast-vote.dto';
import { type VoteRecord, VotesRepository, type VoteTally } from './votes.repository';

@Injectable()
export class VotesService {
  constructor(
    private readonly votesRepository: VotesRepository,
    private readonly motionsService: MotionsService,
    private readonly conflictDeclarationsRepository: ConflictDeclarationsRepository,
  ) {}

  async castVote(dto: CastVoteDto, user: AuthenticatedUser): Promise<VoteRecord> {
    const motion = await this.motionsService.getById(dto.motionId);

    if (motion.status === 'DRAFT' || motion.status === 'WITHDRAWN') {
      throw new ConflictException('Cannot record votes on a motion that is not active.');
    }

    if (motion.motionPhase !== 'CALLED') {
      throw new ConflictException('Voting has not been called on this motion.');
    }

    if (!user.permissions.includes('vote.record')) {
      throw new ForbiddenException('Missing vote.record permission');
    }

    const existingVote = await this.votesRepository.getByMotionAndMember(dto.motionId, dto.councilMemberId);
    if (existingVote) {
      throw new ConflictException('Vote has already been recorded for this member on this motion.');
    }

    const coiDeclaration = await this.conflictDeclarationsRepository.getByMeetingAndUser(
      motion.meetingId,
      dto.councilMemberId,
    );

    if (coiDeclaration && !dto.isConflictDeclared) {
      throw new ConflictException(
        'Member has declared a conflict of interest for this meeting and must flag it when voting.',
      );
    }

    if (!coiDeclaration && dto.isConflictDeclared) {
      throw new ConflictException(
        'Member has not declared a conflict of interest — isConflictDeclared must be false.',
      );
    }

    return this.votesRepository.upsert({
      motionId: dto.motionId,
      councilMemberId: dto.councilMemberId,
      voteValue: dto.voteValue,
      isConflictDeclared: dto.isConflictDeclared,
      note: dto.note,
    });
  }

  async listByMotion(motionId: string): Promise<VoteRecord[]> {
    await this.motionsService.getById(motionId);
    return this.votesRepository.listByMotion(motionId);
  }

  async getTally(motionId: string): Promise<VoteTally> {
    await this.motionsService.getById(motionId);
    return this.votesRepository.getTally(motionId);
  }

  async getVote(id: string): Promise<VoteRecord> {
    return this.votesRepository.getById(id);
  }

  async updateVote(id: string, dto: UpdateVoteDto): Promise<VoteRecord> {
    const existing = await this.votesRepository.getById(id);
    return this.votesRepository.upsert({
      motionId: existing.motionId,
      councilMemberId: existing.councilMemberId,
      voteValue: dto.voteValue ?? existing.voteValue,
      isConflictDeclared: dto.isConflictDeclared ?? existing.isConflictDeclared,
      note: dto.note,
    });
  }

  async removeVote(id: string): Promise<{ ok: true }> {
    await this.votesRepository.remove(id);
    return { ok: true };
  }
}
