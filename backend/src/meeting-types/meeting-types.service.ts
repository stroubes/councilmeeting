import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import type { CreateMeetingTypeDto } from './dto/create-meeting-type.dto';
import { MeetingTypesRepository, type MeetingTypeRecord } from './meeting-types.repository';

@Injectable()
export class MeetingTypesService {
  constructor(private readonly meetingTypesRepository: MeetingTypesRepository) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  list(includeInactive: boolean): Promise<MeetingTypeRecord[]> {
    return this.meetingTypesRepository.list({ includeInactive });
  }

  async create(dto: CreateMeetingTypeDto, user: AuthenticatedUser): Promise<MeetingTypeRecord> {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.meetingTypesRepository
      .getByCode(code)
      .then((meetingType) => meetingType)
      .catch((error: unknown) => {
        if (error instanceof NotFoundException) {
          return null;
        }
        throw error;
      });
    if (existing) {
      throw new ConflictException('Meeting type code already exists');
    }

    return this.meetingTypesRepository.create({
      code,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      isInCamera: dto.isInCamera ?? false,
      isActive: dto.isActive ?? true,
      createdBy: user.id,
    });
  }

  getByCode(code: string): Promise<MeetingTypeRecord> {
    return this.meetingTypesRepository.getByCode(code.trim().toUpperCase());
  }

  async remove(id: string): Promise<{ ok: true }> {
    await this.meetingTypesRepository.remove(id);
    return { ok: true };
  }
}
