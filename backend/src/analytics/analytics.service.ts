import { Injectable } from '@nestjs/common';
import { AgendasService } from '../agendas/agendas.service';
import { MinutesService } from '../minutes/minutes.service';
import { MeetingsService } from '../meetings/meetings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportsService } from '../reports/reports.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

export interface MonthlyPublicationSlice {
  month: string;
  agendas: number;
  reports: number;
  minutes: number;
}

export interface ExecutiveKpiSnapshot {
  generatedAt: string;
  totals: { meetings: number; agendas: number; reports: number; minutes: number };
  approvals: { directorPending: number; caoPending: number; totalPending: number };
  publicationCoverage: {
    agendasPublishedPct: number;
    reportsPublishedPct: number;
    minutesPublishedPct: number;
  };
  cycleTimeHours: {
    agendaMedian: number;
    reportMedian: number;
    minutesMedian: number;
  };
  reportWorkflow: {
    approvedOrPublishedRate: number;
    rejectedRate: number;
  };
  digest: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
    latestDigestEventAt?: string;
  };
  monthlyPublications: MonthlyPublicationSlice[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly agendasService: AgendasService,
    private readonly reportsService: ReportsService,
    private readonly minutesService: MinutesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async executiveKpis(): Promise<ExecutiveKpiSnapshot> {
    const [meetings, agendas, reports, minutes, directorQueue, caoQueue, observability] = await Promise.all([
      this.meetingsService.list({ inCamera: 'true' }, this.systemViewUser()),
      this.agendasService.list(),
      this.reportsService.list({}),
      this.minutesService.list(),
      this.reportsService.listPendingDirector(),
      this.reportsService.listPendingCao(),
      this.notificationsService.observability(),
    ]);

    const publishedAgendas = agendas.filter((entry) => entry.status === 'PUBLISHED' && entry.publishedAt);
    const publishedMinutes = minutes.filter((entry) => entry.status === 'PUBLISHED' && entry.publishedAt);
    const publishedReports = reports.filter((entry) => entry.workflowStatus === 'PUBLISHED');

    const reportPublishedAtMap = new Map<string, string>();
    await Promise.all(
      publishedReports.map(async (report) => {
        const history = await this.reportsService.getApprovalHistory(report.id);
        const publishedEvent = history
          .filter((event) => event.action === 'PUBLISHED')
          .sort((left, right) => right.actedAt.localeCompare(left.actedAt))[0];
        if (publishedEvent?.actedAt) {
          reportPublishedAtMap.set(report.id, publishedEvent.actedAt);
        }
      }),
    );

    const agendaCycleHours = publishedAgendas
      .map((entry) => durationHours(entry.createdAt, entry.publishedAt as string))
      .filter((value): value is number => value !== null);
    const reportCycleHours = publishedReports
      .map((entry) => durationHours(entry.createdAt, reportPublishedAtMap.get(entry.id)))
      .filter((value): value is number => value !== null);
    const minutesCycleHours = publishedMinutes
      .map((entry) => durationHours(entry.createdAt, entry.publishedAt))
      .filter((value): value is number => value !== null);

    const approvedOrPublished = reports.filter(
      (entry) => entry.workflowStatus === 'APPROVED' || entry.workflowStatus === 'PUBLISHED',
    ).length;
    const rejected = reports.filter((entry) => entry.workflowStatus === 'REJECTED').length;

    const monthlyPublications = buildMonthlyPublicationTrend({
      agendas: publishedAgendas.map((entry) => entry.publishedAt as string),
      reports: Array.from(reportPublishedAtMap.values()),
      minutes: publishedMinutes.map((entry) => entry.publishedAt as string),
    });

    const digestDeliveryRate = percentage(observability.digest.delivered, Math.max(1, observability.digest.total));

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        meetings: meetings.length,
        agendas: agendas.length,
        reports: reports.length,
        minutes: minutes.length,
      },
      approvals: {
        directorPending: directorQueue.length,
        caoPending: caoQueue.length,
        totalPending: directorQueue.length + caoQueue.length,
      },
      publicationCoverage: {
        agendasPublishedPct: percentage(publishedAgendas.length, Math.max(1, agendas.length)),
        reportsPublishedPct: percentage(publishedReports.length, Math.max(1, reports.length)),
        minutesPublishedPct: percentage(publishedMinutes.length, Math.max(1, minutes.length)),
      },
      cycleTimeHours: {
        agendaMedian: round1(median(agendaCycleHours)),
        reportMedian: round1(median(reportCycleHours)),
        minutesMedian: round1(median(minutesCycleHours)),
      },
      reportWorkflow: {
        approvedOrPublishedRate: percentage(approvedOrPublished, Math.max(1, reports.length)),
        rejectedRate: percentage(rejected, Math.max(1, reports.length)),
      },
      digest: {
        total: observability.digest.total,
        delivered: observability.digest.delivered,
        failed: observability.digest.failed,
        pending: observability.digest.pending,
        deliveryRate: digestDeliveryRate,
        latestDigestEventAt: observability.digest.latestDigestEventAt,
      },
      monthlyPublications,
    };
  }

  private systemViewUser(): AuthenticatedUser {
    return {
      id: 'system-analytics',
      microsoftOid: 'system-analytics',
      email: 'system@analytics.local',
      displayName: 'System Analytics',
      roles: ['SYSTEM'],
      permissions: ['meeting.read.in_camera'],
    };
  }
}

function durationHours(startAt?: string, endAt?: string): number | null {
  if (!startAt || !endAt) {
    return null;
  }
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  return (end.getTime() - start.getTime()) / (60 * 60 * 1000);
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function percentage(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, round1((value / total) * 100)));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildMonthlyPublicationTrend(input: {
  agendas: string[];
  reports: string[];
  minutes: string[];
}): MonthlyPublicationSlice[] {
  const monthKeys = lastMonthKeys(6);
  const entries = monthKeys.map((month) => ({ month, agendas: 0, reports: 0, minutes: 0 }));
  const byMonth = new Map(entries.map((entry) => [entry.month, entry]));

  for (const value of input.agendas) {
    const key = toMonthKey(value);
    const bucket = byMonth.get(key);
    if (bucket) {
      bucket.agendas += 1;
    }
  }

  for (const value of input.reports) {
    const key = toMonthKey(value);
    const bucket = byMonth.get(key);
    if (bucket) {
      bucket.reports += 1;
    }
  }

  for (const value of input.minutes) {
    const key = toMonthKey(value);
    const bucket = byMonth.get(key);
    if (bucket) {
      bucket.minutes += 1;
    }
  }

  return entries;
}

function toMonthKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function lastMonthKeys(monthCount: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    keys.push(`${year}-${month}`);
  }
  return keys;
}
