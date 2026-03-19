import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import type { CreateMeetingDto } from './dto/create-meeting.dto';
import type { MeetingListQueryDto } from './dto/meeting-list-query.dto';
import type { MeetingQueryDto } from './dto/meeting-query.dto';
import type { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingsRepository } from './meetings.repository';
import { MeetingTypesService } from '../meeting-types/meeting-types.service';

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ADJOURNED' | 'CANCELLED' | 'COMPLETED';

export interface MeetingRecord {
  id: string;
  title: string;
  description?: string;
  meetingTypeCode: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  status: MeetingStatus;
  isPublic: boolean;
  isInCamera: boolean;
  videoUrl?: string;
  recurrenceGroupId?: string;
  recurrenceIndex?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingPageResult {
  items: MeetingRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class MeetingsService {
  constructor(
    private readonly meetingsRepository: MeetingsRepository,
    private readonly meetingTypesService: MeetingTypesService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async create(dto: CreateMeetingDto, user: AuthenticatedUser): Promise<MeetingRecord> {
    const meetingType = await this.meetingTypesService.getByCode(dto.meetingTypeCode);
    const meetingTypeCode = meetingType.code;

    return this.meetingsRepository.create({
      title: dto.title,
      description: dto.description,
      meetingTypeCode,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      location: dto.location,
      status: 'SCHEDULED',
      isPublic: dto.isPublic ?? !meetingType.isInCamera,
      isInCamera: meetingType.isInCamera,
      videoUrl: dto.videoUrl,
      recurrenceGroupId: dto.recurrenceGroupId,
      recurrenceIndex: dto.recurrenceIndex,
      createdBy: user.id,
    });
  }

  async list(query: MeetingQueryDto, user: AuthenticatedUser): Promise<MeetingRecord[]> {
    return this.meetingsRepository.list(this.applyInCameraAccess(query, user));
  }

  listPaged(query: MeetingListQueryDto, user: AuthenticatedUser): Promise<MeetingPageResult> {
    return this.meetingsRepository.listPaged(this.applyInCameraAccess(query, user));
  }

  listPublic(): Promise<MeetingRecord[]> {
    return this.meetingsRepository.listPublic();
  }

  async getById(id: string, user: AuthenticatedUser): Promise<MeetingRecord> {
    const meeting = await this.meetingsRepository.getById(id);

    if (meeting.isInCamera && !user.permissions.includes(PERMISSIONS.MEETING_READ_IN_CAMERA)) {
      throw new ForbiddenException('In-camera access denied');
    }

    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto, user: AuthenticatedUser): Promise<MeetingRecord> {
    const existing = await this.getById(id, user);
    let meetingTypeCode = existing.meetingTypeCode;
    let isInCamera = existing.isInCamera;

    if (dto.meetingTypeCode) {
      const meetingType = await this.meetingTypesService.getByCode(dto.meetingTypeCode);
      meetingTypeCode = meetingType.code;
      isInCamera = meetingType.isInCamera;
    }

    const isPublic = dto.isPublic ?? (isInCamera ? false : existing.isPublic);
    const updated: MeetingRecord = {
      ...existing,
      ...dto,
      meetingTypeCode,
      isInCamera,
      isPublic,
      updatedAt: new Date().toISOString(),
    };

    if (dto.startsAt || dto.endsAt) {
      const startsAt = new Date(updated.startsAt).getTime();
      const endsAt = updated.endsAt ? new Date(updated.endsAt).getTime() : null;
      if (endsAt !== null && endsAt < startsAt) {
        throw new ForbiddenException('Meeting end time cannot be before start time');
      }
    }

    return this.meetingsRepository.update(id, updated);
  }

  exists(id: string): Promise<boolean> {
    return this.meetingsRepository.exists(id);
  }

  async remove(id: string): Promise<{ ok: true }> {
    await this.meetingsRepository.remove(id);
    return { ok: true };
  }

  private applyInCameraAccess<T extends MeetingQueryDto>(query: T, user: AuthenticatedUser): T {
    if (user.permissions.includes(PERMISSIONS.MEETING_READ_IN_CAMERA)) {
      return query;
    }

    return {
      ...query,
      inCamera: 'false',
    };
  }
}
