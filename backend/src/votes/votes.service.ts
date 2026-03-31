import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MotionsService } from '../motions/motions.service';
import type { CastVoteDto, UpdateVoteDto } from './dto/cast-vote.dto';
import { type VoteRecord, VotesRepository, type VoteTally } from './votes.repository';

@Injectable()
export class VotesService {
  constructor(
    private readonly votesRepository: VotesRepository,
    private readonly motionsService: MotionsService,
  ) {}

  async castVote(dto: CastVoteDto, user: AuthenticatedUser): Promise<VoteRecord> {
    const motion = await this.motionsService.getById(dto.motionId);
    if (motion.status === 'DRAFT' || motion.status === 'WITHDRAWN') {
      throw new ConflictException('Cannot record votes on a motion that is not active.');
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