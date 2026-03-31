import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import type { CreateConflictDeclarationDto } from './dto/create-conflict-declaration.dto';
import type { UpdateConflictDeclarationDto } from './dto/update-conflict-declaration.dto';
import type { ConflictDeclarationRecord } from './conflict-declarations.repository';
import { ConflictDeclarationsRepository } from './conflict-declarations.repository';

@Injectable()
export class ConflictDeclarationsService {
  constructor(private readonly conflictDeclarationsRepository: ConflictDeclarationsRepository) {}

  async create(dto: CreateConflictDeclarationDto, user: AuthenticatedUser): Promise<ConflictDeclarationRecord> {
    const existing = await this.conflictDeclarationsRepository.getByMeetingAndUser(dto.meetingId, dto.userId);
    if (existing) {
      throw new ConflictException('A conflict of interest declaration already exists for this user in this meeting.');
    }
    return this.conflictDeclarationsRepository.create({
      meetingId: dto.meetingId,
      agendaItemId: dto.agendaItemId,
      userId: dto.userId,
      reason: dto.reason,
      recordedByUserId: user.id,
    });
  }

  async listByMeeting(meetingId: string): Promise<ConflictDeclarationRecord[]> {
    return this.conflictDeclarationsRepository.listByMeeting(meetingId);
  }

  async listByAgendaItem(agendaItemId: string): Promise<ConflictDeclarationRecord[]> {
    return this.conflictDeclarationsRepository.listByAgendaItem(agendaItemId);
  }

  async getById(id: string): Promise<ConflictDeclarationRecord> {
    return this.conflictDeclarationsRepository.getById(id);
  }

  async update(id: string, dto: UpdateConflictDeclarationDto): Promise<ConflictDeclarationRecord> {
    return this.conflictDeclarationsRepository.update(id, dto);
  }

  async remove(id: string): Promise<{ ok: true }> {
    await this.conflictDeclarationsRepository.getById(id);
    await this.conflictDeclarationsRepository.remove(id);
    return { ok: true };
  }
}