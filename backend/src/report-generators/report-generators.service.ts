import { Injectable } from '@nestjs/common';
import { MeetingsService, type MeetingRecord } from '../meetings/meetings.service';
import { MotionsService } from '../motions/motions.service';
import type { MotionRecord } from '../motions/motions.repository';
import { VotesService } from '../votes/votes.service';
import type { VoteRecord } from '../votes/votes.repository';
import { ConflictDeclarationsService } from '../conflict-declarations/conflict-declarations.service';
import type { ConflictDeclarationRecord } from '../conflict-declarations/conflict-declarations.repository';
import { UsersService } from '../users/users.service';
import type { ManagedUserRecord } from '../users/users.repository';

export interface AttendanceReportParams {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingId?: string;
}

export interface AttendanceMeetingEntry {
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  meetingType: string;
  status: string;
  attendees: AttendanceEntry[];
  absentMembers: AttendanceEntry[];
}

export interface AttendanceEntry {
  userId: string;
  displayName: string;
  voteRecorded: boolean;
  voteValue?: string;
  coiDeclared: boolean;
}

export interface MotionReportParams {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingId?: string;
  status?: string;
}

export interface MotionReportEntry {
  motionId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  agendaItemTitle?: string;
  title: string;
  body: string;
  status: string;
  outcome?: string;
  moverUserId?: string;
  moverName?: string;
  seconderName?: string;
  createdAt: string;
}

export interface VotingReportParams {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingId?: string;
  motionId?: string;
}

export interface VotingReportEntry {
  voteId: string;
  motionId: string;
  motionTitle: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  councilMemberId: string;
  memberName: string;
  voteValue: string;
  isConflictDeclared: boolean;
  votedAt: string;
}

export interface ConflictReportParams {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingId?: string;
}

export interface ConflictReportEntry {
  declarationId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  userId: string;
  userName: string;
  agendaItemId?: string;
  agendaItemTitle?: string;
  reason?: string;
  declaredAt: string;
}

export interface ForecastReportParams {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingTypeCode?: string;
}

export interface ForecastReportEntry {
  meetingId: string;
  title: string;
  meetingType: string;
  startsAt: string;
  location?: string;
  status: string;
  expectedItems: number;
}

@Injectable()
export class ReportGeneratorsService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly motionsService: MotionsService,
    private readonly votesService: VotesService,
    private readonly coiService: ConflictDeclarationsService,
    private readonly usersService: UsersService,
  ) {}

  async generateAttendanceReport(params: AttendanceReportParams): Promise<AttendanceMeetingEntry[]> {
    const query: any = {};
    if (params.startsAtFrom) query.startsAtFrom = params.startsAtFrom;
    if (params.startsAtTo) query.startsAtTo = params.startsAtTo;
    if (params.meetingId) query.meetingId = params.meetingId;

    const meetings = await this.meetingsService.list(query, { id: 'system', roles: [], permissions: [] } as any);
    const results: AttendanceMeetingEntry[] = [];

    for (const meeting of meetings) {
      if (meeting.status === 'SCHEDULED') continue;

      const votes = await this.votesService.listByMotion('');
      const allVotesForMeeting = await this.getVotesForMeeting(meeting.id);
      const coisForMeeting = await this.coiService.listByMeeting(meeting.id);

      const presentMembers = new Map<string, AttendanceEntry>();
      const absentMembers = new Map<string, AttendanceEntry>();

      for (const vote of allVotesForMeeting) {
        const entry: AttendanceEntry = {
          userId: vote.councilMemberId,
          displayName: await this.getUserDisplayName(vote.councilMemberId),
          voteRecorded: true,
          voteValue: vote.voteValue,
          coiDeclared: vote.isConflictDeclared,
        };
        presentMembers.set(vote.councilMemberId, entry);
      }

      for (const coi of coisForMeeting) {
        if (!presentMembers.has(coi.userId)) {
          presentMembers.set(coi.userId, {
            userId: coi.userId,
            displayName: await this.getUserDisplayName(coi.userId),
            voteRecorded: false,
            coiDeclared: true,
          });
        }
      }

      const allKnownMembers = new Set([...presentMembers.keys()]);

      results.push({
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        meetingDate: meeting.startsAt,
        meetingType: meeting.meetingTypeCode,
        status: meeting.status,
        attendees: Array.from(presentMembers.values()),
        absentMembers: Array.from(absentMembers.values()),
      });
    }

    return results;
  }

  async generateMotionReport(params: MotionReportParams): Promise<MotionReportEntry[]> {
    const meetings = await this.getMeetingsForReport(params.startsAtFrom, params.startsAtTo, params.meetingId);
    const results: MotionReportEntry[] = [];

    for (const meeting of meetings) {
      const motions = await this.motionsService.list(meeting.id);

      for (const motion of motions) {
        if (params.status && motion.status !== params.status) continue;

        results.push({
          motionId: motion.id,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          meetingDate: meeting.startsAt,
          agendaItemTitle: undefined,
          title: motion.title,
          body: motion.body,
          status: motion.status,
          outcome: motion.resultNote,
          moverUserId: motion.moverUserId,
          moverName: motion.moverUserId ? await this.getUserDisplayName(motion.moverUserId) : undefined,
          seconderName: motion.seconderUserId ? await this.getUserDisplayName(motion.seconderUserId) : undefined,
          createdAt: motion.createdAt,
        });
      }
    }

    return results;
  }

  async generateVotingReport(params: VotingReportParams): Promise<VotingReportEntry[]> {
    const meetings = await this.getMeetingsForReport(params.startsAtFrom, params.startsAtTo, params.meetingId);
    const results: VotingReportEntry[] = [];

    for (const meeting of meetings) {
      const motions = await this.motionsService.list(meeting.id);
      const meetingMotions = params.motionId ? motions.filter(m => m.id === params.motionId) : motions;

      for (const motion of meetingMotions) {
        const votes = await this.votesService.listByMotion(motion.id);

        for (const vote of votes) {
          results.push({
            voteId: vote.id,
            motionId: motion.id,
            motionTitle: motion.title,
            meetingId: meeting.id,
            meetingTitle: meeting.title,
            meetingDate: meeting.startsAt,
            councilMemberId: vote.councilMemberId,
            memberName: await this.getUserDisplayName(vote.councilMemberId),
            voteValue: vote.voteValue,
            isConflictDeclared: vote.isConflictDeclared,
            votedAt: vote.votedAt,
          });
        }
      }
    }

    return results;
  }

  async generateConflictOfInterestReport(params: ConflictReportParams): Promise<ConflictReportEntry[]> {
    const meetings = await this.getMeetingsForReport(params.startsAtFrom, params.startsAtTo, params.meetingId);
    const results: ConflictReportEntry[] = [];

    for (const meeting of meetings) {
      const cois = await this.coiService.listByMeeting(meeting.id);

      for (const coi of cois) {
        results.push({
          declarationId: coi.id,
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          meetingDate: meeting.startsAt,
          userId: coi.userId,
          userName: await this.getUserDisplayName(coi.userId),
          agendaItemId: coi.agendaItemId,
          agendaItemTitle: undefined,
          reason: coi.reason,
          declaredAt: coi.declaredAt,
        });
      }
    }

    return results;
  }

  async generateForecastReport(params: ForecastReportParams): Promise<ForecastReportEntry[]> {
    const query: any = {};
    if (params.startsAtFrom) query.startsAtFrom = params.startsAtFrom;
    if (params.startsAtTo) query.startsAtTo = params.startsAtTo;

    const meetings = await this.meetingsService.list(query, { id: 'system', roles: [], permissions: [] } as any);

    const upcoming = meetings
      .filter(m => m.status === 'SCHEDULED')
      .filter(m => !params.meetingTypeCode || m.meetingTypeCode === params.meetingTypeCode)
      .map(m => ({
        meetingId: m.id,
        title: m.title,
        meetingType: m.meetingTypeCode,
        startsAt: m.startsAt,
        location: m.location,
        status: m.status,
        expectedItems: 0,
      }));

    return upcoming;
  }

  private async getMeetingsForReport(
    startsAtFrom?: string,
    startsAtTo?: string,
    meetingId?: string,
  ): Promise<MeetingRecord[]> {
    const query: any = {};
    if (startsAtFrom) query.startsAtFrom = startsAtFrom;
    if (startsAtTo) query.startsAtTo = startsAtTo;
    if (meetingId) query.meetingId = meetingId;

    const allMeetings = await this.meetingsService.list(query, { id: 'system', roles: [], permissions: [] } as any);
    return allMeetings.filter(m => m.status !== 'SCHEDULED');
  }

  private async getVotesForMeeting(meetingId: string): Promise<VoteRecord[]> {
    const allVotes: VoteRecord[] = [];
    try {
      const motions = await this.motionsService.list(meetingId);
      for (const motion of motions) {
        const votes = await this.votesService.listByMotion(motion.id);
        allVotes.push(...votes);
      }
    } catch {
      // fallback to empty
    }
    return allVotes;
  }

  private async getUserDisplayName(userId: string): Promise<string> {
    try {
      const users = await this.usersService.list();
      const user = users.find(u => u.id === userId);
      return user?.displayName ?? userId;
    } catch {
      return userId;
    }
  }
}