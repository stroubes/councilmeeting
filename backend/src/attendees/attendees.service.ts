import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { MeetingsService } from '../meetings/meetings.service';
import type { CreateAttendeeDto } from './dto/create-attendee.dto';
import type { UpdateAttendeeDto } from './dto/update-attendee.dto';
import {
  AttendeesRepository,
  type MeetingAttendeeRecord,
  type QuorumStatus,
} from './attendees.repository';

@Injectable()
export class AttendeesService {
  constructor(
    private readonly attendeesRepository: AttendeesRepository,
    private readonly meetingsService: MeetingsService,
  ) {}

  async create(dto: CreateAttendeeDto, user: AuthenticatedUser): Promise<MeetingAttendeeRecord> {
    const meeting = await this.meetingsService.getById(dto.meetingId, user);
    const conflict = await this.attendeesRepository.upsert(dto.meetingId, dto.userId, {
      role: dto.role,
      status: dto.status,
      arrivedAt: dto.arrivedAt,
      departedAt: dto.departedAt,
      isConflictOfInterest: dto.isConflictOfInterest,
      notes: dto.notes,
      recordedBy: user.id,
    });
    return conflict;
  }

  async listByMeeting(meetingId: string, user: AuthenticatedUser): Promise<MeetingAttendeeRecord[]> {
    await this.meetingsService.getById(meetingId, user);
    return this.attendeesRepository.listByMeeting(meetingId);
  }

  async getById(id: string): Promise<MeetingAttendeeRecord> {
    return this.attendeesRepository.getById(id);
  }

  async update(id: string, dto: UpdateAttendeeDto, user: AuthenticatedUser): Promise<MeetingAttendeeRecord> {
    const existing = await this.attendeesRepository.getById(id);
    await this.meetingsService.getById(existing.meetingId, user);
    return this.attendeesRepository.update(id, {
      role: dto.role,
      status: dto.status,
      arrivedAt: dto.arrivedAt,
      departedAt: dto.departedAt,
      isConflictOfInterest: dto.isConflictOfInterest,
      notes: dto.notes,
    });
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    const existing = await this.attendeesRepository.getById(id);
    await this.meetingsService.getById(existing.meetingId, user);
    await this.attendeesRepository.remove(id);
    return { ok: true };
  }

  async getQuorumStatus(meetingId: string, user: AuthenticatedUser): Promise<QuorumStatus> {
    const meeting = await this.meetingsService.getById(meetingId, user);
    const councilSize = await this.attendeesRepository.getCouncilSizeForMeetingType(meeting.meetingTypeCode);
    const presentCount = await this.attendeesRepository.countPresentCouncilMembers(meetingId);
    const requiredCount = Math.floor(councilSize / 2) + 1;
    return {
      meetingId,
      councilSize,
      requiredCount,
      presentCount,
      isQuorumMet: presentCount >= requiredCount && councilSize > 0,
    };
  }

  async recordArrival(meetingId: string, userId: string, currentUser: AuthenticatedUser): Promise<MeetingAttendeeRecord> {
    await this.meetingsService.getById(meetingId, currentUser);
    return this.attendeesRepository.upsert(meetingId, userId, {
      status: 'PRESENT',
      arrivedAt: new Date().toISOString(),
      recordedBy: currentUser.id,
    });
  }

  async recordDeparture(meetingId: string, userId: string, currentUser: AuthenticatedUser): Promise<MeetingAttendeeRecord> {
    await this.meetingsService.getById(meetingId, currentUser);
    return this.attendeesRepository.upsert(meetingId, userId, {
      status: 'EARLY_DEPARTURE',
      departedAt: new Date().toISOString(),
      recordedBy: currentUser.id,
    });
  }
}