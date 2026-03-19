import { Injectable } from '@nestjs/common';
import { MeetingsService } from '../meetings/meetings.service';
import { AgendasService } from '../agendas/agendas.service';
import { ReportsService } from '../reports/reports.service';
import { MinutesService } from '../minutes/minutes.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreatePublicSubscriptionDto } from './dto/create-public-subscription.dto';
import type { UpdatePublicSubscriptionDto } from './dto/update-public-subscription.dto';
import {
  type PublicSubscriptionFrequency,
  type PublicSubscriptionRecord,
  PublicSubscriptionsRepository,
} from './public-subscriptions.repository';

@Injectable()
export class PublicPortalService {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly agendasService: AgendasService,
    private readonly reportsService: ReportsService,
    private readonly minutesService: MinutesService,
    private readonly publicSubscriptionsRepository: PublicSubscriptionsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async summary() {
    const [meetings, agendas, reports, minutes] = await Promise.all([
      this.listMeetings(),
      this.listAgendas(),
      this.listReports(),
      this.listMinutes(),
    ]);

    return {
      meetings,
      agendas,
      reports,
      minutes,
      counts: {
        meetings: meetings.length,
        agendas: agendas.length,
        reports: reports.length,
        minutes: minutes.length,
      },
    };
  }

  async listMeetings() {
    return this.meetingsService.listPublic();
  }

  async listAgendas() {
    const agendas = await this.agendasService.list();
    return agendas
      .filter((agenda) => agenda.status === 'PUBLISHED')
      .map((agenda) => ({
        ...agenda,
        items: agenda.items.filter((item) => item.status === 'PUBLISHED' && !item.isInCamera),
      }));
  }

  async listReports() {
    const [reports, agendas] = await Promise.all([
      this.reportsService.list({ status: 'PUBLISHED' }),
      this.agendasService.list(),
    ]);

    const publicAgendaItemIds = new Set(
      agendas
        .flatMap((agenda) => agenda.items)
        .filter((item) => !item.isInCamera && item.status === 'PUBLISHED')
        .map((item) => item.id),
    );

    return reports.filter((report) => publicAgendaItemIds.has(report.agendaItemId));
  }

  async listMinutes() {
    const [minutes, meetings] = await Promise.all([
      this.minutesService.list(),
      this.meetingsService.listPublic(),
    ]);
    const publicMeetingIds = new Set(meetings.map((meeting) => meeting.id));
    return minutes.filter((record) => record.status === 'PUBLISHED' && publicMeetingIds.has(record.meetingId));
  }

  async createSubscription(dto: CreatePublicSubscriptionDto): Promise<PublicSubscriptionRecord> {
    return this.publicSubscriptionsRepository.create({
      email: dto.email.trim().toLowerCase(),
      topics: normalizeTopics(dto.topics),
      watchKeywords: normalizeKeywords(dto.watchKeywords),
      frequency: dto.frequency,
    });
  }

  async listSubscriptionsByEmail(email?: string): Promise<PublicSubscriptionRecord[]> {
    if (!email?.trim()) {
      return [];
    }
    return this.publicSubscriptionsRepository.listByEmail(email.trim().toLowerCase());
  }

  async updateSubscription(id: string, dto: UpdatePublicSubscriptionDto): Promise<PublicSubscriptionRecord> {
    return this.publicSubscriptionsRepository.update(id, {
      topics: dto.topics ? normalizeTopics(dto.topics) : undefined,
      watchKeywords: dto.watchKeywords ? normalizeKeywords(dto.watchKeywords) : undefined,
      frequency: dto.frequency,
      isActive: dto.isActive,
    });
  }

  removeSubscription(id: string): Promise<void> {
    return this.publicSubscriptionsRepository.remove(id);
  }

  async previewSubscriptionAlerts(id: string): Promise<{
    subscription: PublicSubscriptionRecord;
    matches: Array<{ topic: string; title: string; id: string; source: 'meeting' | 'agenda' | 'report' | 'minutes' }>;
  }> {
    const subscription = await this.publicSubscriptionsRepository.getById(id);
    const [meetings, agendas, reports, minutes] = await Promise.all([
      this.listMeetings(),
      this.listAgendas(),
      this.listReports(),
      this.listMinutes(),
    ]);

    const matches = collectMatches(subscription, { meetings, agendas, reports, minutes });

    return { subscription, matches: matches.slice(0, 25) };
  }

  async runDigestSweep(now = new Date()): Promise<{
    runAt: string;
    processed: number;
    delivered: number;
    skipped: number;
  }> {
    const [daily, weekly] = await Promise.all([
      this.runDigestForFrequency('DAILY_DIGEST', now),
      this.runDigestForFrequency('WEEKLY_DIGEST', now),
    ]);

    return {
      runAt: now.toISOString(),
      processed: daily.processed + weekly.processed,
      delivered: daily.delivered + weekly.delivered,
      skipped: daily.skipped + weekly.skipped,
    };
  }

  private async runDigestForFrequency(
    frequency: Extract<PublicSubscriptionFrequency, 'DAILY_DIGEST' | 'WEEKLY_DIGEST'>,
    now: Date,
  ): Promise<{ processed: number; delivered: number; skipped: number }> {
    const subscriptions = await this.publicSubscriptionsRepository.listActiveByFrequency(frequency, { limit: 500 });
    if (subscriptions.length === 0) {
      return { processed: 0, delivered: 0, skipped: 0 };
    }

    const publicData = await this.getPublicDataSnapshot();
    let delivered = 0;
    let skipped = 0;

    for (const subscription of subscriptions) {
      if (!isDigestDue(subscription, now, frequency)) {
        skipped += 1;
        continue;
      }

      const matches = collectMatches(subscription, publicData).slice(0, 25);
      if (matches.length === 0) {
        skipped += 1;
        continue;
      }

      await this.notificationsService.emit({
        eventType: `PUBLIC_DIGEST_${frequency}`,
        entityType: 'public_subscription',
        entityId: subscription.id,
        payloadJson: {
          recipientEmail: subscription.email,
          frequency,
          topics: subscription.topics,
          watchKeywords: subscription.watchKeywords,
          matchCount: matches.length,
          matches,
        },
      });

      await this.publicSubscriptionsRepository.update(subscription.id, {
        lastNotifiedAt: now.toISOString(),
      });
      delivered += 1;
    }

    return {
      processed: subscriptions.length,
      delivered,
      skipped,
    };
  }

  private async getPublicDataSnapshot(): Promise<{
    meetings: Awaited<ReturnType<PublicPortalService['listMeetings']>>;
    agendas: Awaited<ReturnType<PublicPortalService['listAgendas']>>;
    reports: Awaited<ReturnType<PublicPortalService['listReports']>>;
    minutes: Awaited<ReturnType<PublicPortalService['listMinutes']>>;
  }> {
    const [meetings, agendas, reports, minutes] = await Promise.all([
      this.listMeetings(),
      this.listAgendas(),
      this.listReports(),
      this.listMinutes(),
    ]);

    return { meetings, agendas, reports, minutes };
  }
}

function isDigestDue(
  subscription: PublicSubscriptionRecord,
  now: Date,
  frequency: Extract<PublicSubscriptionFrequency, 'DAILY_DIGEST' | 'WEEKLY_DIGEST'>,
): boolean {
  if (!subscription.lastNotifiedAt) {
    return true;
  }

  const previous = new Date(subscription.lastNotifiedAt);
  if (Number.isNaN(previous.getTime())) {
    return true;
  }

  const elapsedMs = now.getTime() - previous.getTime();
  const thresholdMs = frequency === 'DAILY_DIGEST' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return elapsedMs >= thresholdMs;
}

function collectMatches(
  subscription: PublicSubscriptionRecord,
  data: {
    meetings: Awaited<ReturnType<PublicPortalService['listMeetings']>>;
    agendas: Awaited<ReturnType<PublicPortalService['listAgendas']>>;
    reports: Awaited<ReturnType<PublicPortalService['listReports']>>;
    minutes: Awaited<ReturnType<PublicPortalService['listMinutes']>>;
  },
): Array<{ topic: string; title: string; id: string; source: 'meeting' | 'agenda' | 'report' | 'minutes' }> {
  const matches: Array<{ topic: string; title: string; id: string; source: 'meeting' | 'agenda' | 'report' | 'minutes' }> = [];

  if (subscription.topics.includes('MEETINGS')) {
    data.meetings.forEach((meeting) => {
      if (matchesKeywords(subscription.watchKeywords, `${meeting.title} ${meeting.meetingTypeCode}`)) {
        matches.push({ topic: 'MEETINGS', title: meeting.title, id: meeting.id, source: 'meeting' });
      }
    });
  }

  if (subscription.topics.includes('AGENDAS')) {
    data.agendas.forEach((agenda) => {
      if (matchesKeywords(subscription.watchKeywords, agenda.title)) {
        matches.push({ topic: 'AGENDAS', title: agenda.title, id: agenda.id, source: 'agenda' });
      }
    });
  }

  if (subscription.topics.includes('REPORTS') || subscription.topics.includes('BUDGET')) {
    data.reports.forEach((report) => {
      const topic = hasBudgetTerm(report.title, report.executiveSummary) ? 'BUDGET' : 'REPORTS';
      if (!subscription.topics.includes(topic as (typeof subscription.topics)[number])) {
        return;
      }

      if (matchesKeywords(subscription.watchKeywords, `${report.title} ${report.executiveSummary ?? ''}`)) {
        matches.push({ topic, title: report.title, id: report.id, source: 'report' });
      }
    });
  }

  if (subscription.topics.includes('MINUTES')) {
    data.minutes.forEach((record) => {
      if (matchesKeywords(subscription.watchKeywords, `${record.meetingId} ${record.contentJson.summary ?? ''}`)) {
        matches.push({
          topic: 'MINUTES',
          title: `Minutes ${record.meetingId.slice(0, 8)}`,
          id: record.id,
          source: 'minutes',
        });
      }
    });
  }

  return matches;
}

function normalizeTopics(topics: string[]): PublicSubscriptionRecord['topics'] {
  const allowed = new Set(['MEETINGS', 'AGENDAS', 'REPORTS', 'MINUTES', 'MOTIONS', 'BUDGET']);
  const normalized = topics
    .map((topic) => topic.trim().toUpperCase())
    .filter((topic) => allowed.has(topic));

  return Array.from(new Set(normalized)) as PublicSubscriptionRecord['topics'];
}

function normalizeKeywords(keywords?: string[]): string[] {
  return Array.from(
    new Set(
      (keywords ?? [])
        .map((keyword) => keyword.trim().toLowerCase())
        .filter((keyword) => keyword.length > 1)
        .slice(0, 20),
    ),
  );
}

function matchesKeywords(keywords: string[], haystack: string): boolean {
  if (keywords.length === 0) {
    return true;
  }
  const normalizedHaystack = haystack.toLowerCase();
  return keywords.some((keyword) => normalizedHaystack.includes(keyword));
}

function hasBudgetTerm(...values: Array<string | undefined>): boolean {
  const combined = values.filter(Boolean).join(' ').toLowerCase();
  return combined.includes('budget') || combined.includes('financial plan');
}
