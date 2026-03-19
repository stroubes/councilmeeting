import type { AgendaRecord } from './agenda.types';
import type { MeetingRecord } from './meeting.types';
import type { MinutesRecord } from './minutes.types';
import type { StaffReportRecord } from './report.types';

export interface PublicSummaryResponse {
  meetings: MeetingRecord[];
  agendas: AgendaRecord[];
  reports: StaffReportRecord[];
  minutes: MinutesRecord[];
  counts: {
    meetings: number;
    agendas: number;
    reports: number;
    minutes: number;
  };
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
