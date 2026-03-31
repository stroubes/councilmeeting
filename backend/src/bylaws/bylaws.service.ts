import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import type { CreateBylawDto } from './dto/create-bylaw.dto';
import type { UpdateBylawDto } from './dto/update-bylaw.dto';
import type { BylawRecord } from './bylaws.repository';
import { BylawsRepository } from './bylaws.repository';

@Injectable()
export class BylawsService {
  constructor(private readonly bylawsRepository: BylawsRepository) {}

  async create(dto: CreateBylawDto, user: AuthenticatedUser): Promise<BylawRecord> {
    const existing = await this.bylawsRepository.findByNumber(dto.bylawNumber);
    if (existing) {
      throw new ConflictException(`Bylaw with number "${dto.bylawNumber}" already exists.`);
    }
    return this.bylawsRepository.create({
      bylawNumber: dto.bylawNumber,
      title: dto.title,
      description: dto.description,
      contentJson: dto.contentJson,
      adoptedAt: dto.adoptedAt,
      createdBy: user.id,
    });
  }

  async list(): Promise<BylawRecord[]> {
    return this.bylawsRepository.list();
  }

  async listActive(): Promise<BylawRecord[]> {
    return this.bylawsRepository.listActive();
  }

  async getById(id: string): Promise<BylawRecord> {
    return this.bylawsRepository.getById(id);
  }

  async getByNumber(bylawNumber: string): Promise<BylawRecord> {
    return this.bylawsRepository.getByNumber(bylawNumber);
  }

  async update(id: string, dto: UpdateBylawDto, user: AuthenticatedUser): Promise<BylawRecord> {
    const existing = await this.bylawsRepository.getById(id);
    if (existing.status === 'DELETED') {
      throw new ConflictException('Cannot update a deleted bylaw.');
    }
    if (dto.bylawNumber && dto.bylawNumber !== existing.bylawNumber) {
      const duplicate = await this.bylawsRepository.findByNumber(dto.bylawNumber);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Bylaw with number "${dto.bylawNumber}" already exists.`);
      }
    }
    return this.bylawsRepository.update(id, {
      ...dto,
      updatedBy: user.id,
    });
  }

  async amend(id: string, dto: UpdateBylawDto, user: AuthenticatedUser): Promise<BylawRecord> {
    const existing = await this.bylawsRepository.getById(id);
    if (existing.status !== 'ACTIVE') {
      throw new ConflictException('Only active bylaws can be amended.');
    }
    return this.bylawsRepository.update(id, {
      ...dto,
      amendedAt: new Date().toISOString(),
      updatedBy: user.id,
    });
  }

  async repeal(id: string, meetingId: string, user: AuthenticatedUser): Promise<BylawRecord> {
    const existing = await this.bylawsRepository.getById(id);
    if (existing.status !== 'ACTIVE') {
      throw new ConflictException('Only active bylaws can be repealed.');
    }
    return this.bylawsRepository.update(id, {
      status: 'INACTIVE',
      repealingMeetingId: meetingId,
      updatedBy: user.id,
    });
  }

  async remove(id: string): Promise<{ ok: true }> {
    await this.bylawsRepository.getById(id);
    await this.bylawsRepository.remove(id);
    return { ok: true };
  }
}
