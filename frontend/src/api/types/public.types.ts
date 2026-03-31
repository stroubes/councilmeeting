import type { AgendaRecord } from './agenda.types';
import type { MeetingRecord } from './meeting.types';
import type { MinutesRecord } from './minutes.types';
import type { StaffReportRecord } from './report.types';
import type { MotionRecord } from './motion.types';
import type { ResolutionRecord } from './resolution.types';
import type { ActionItemRecord } from './action.types';

export interface PublicSummaryResponse {
  meetings: MeetingRecord[];
  agendas: AgendaRecord[];
  reports: StaffReportRecord[];
  minutes: MinutesRecord[];
  motions: MotionRecord[];
  resolutions: ResolutionRecord[];
  actions: ActionItemRecord[];
  packages: PublicMeetingPackage[];
  counts: {
    meetings: number;
    agendas: number;
    reports: number;
    minutes: number;
    motions: number;
    resolutions: number;
    actions: number;
    packages: number;
  };
}

export interface PublicMeetingPackage {
  meetingId: string;
  meetingTitle: string;
  meetingStartsAt: string;
  agenda: AgendaRecord | null;
  reports: StaffReportRecord[];
  minutes: MinutesRecord | null;
  motions: MotionRecord[];
  resolutions: ResolutionRecord[];
}

export type PublicSubscriptionTopic = 'MEETINGS' | 'AGENDAS' | 'REPORTS' | 'MINUTES' | 'MOTIONS' | 'BUDGET';
export type PublicSubscriptionFrequency = 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';

export interface PublicSubscriptionRecord {
  id: string;
  email: string;
  topics: PublicSubscriptionTopic[];
  watchKeywords: string[];
  frequency: PublicSubscriptionFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastNotifiedAt?: string;
}

export interface PublicSubscriptionPreview {
  subscription: PublicSubscriptionRecord;
  matches: Array<{
    topic: string;
    title: string;
    id: string;
    source: 'meeting' | 'agenda' | 'report' | 'minutes';
  }>;
}
