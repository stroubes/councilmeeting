import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationsRepository,
  type NotificationDeliveryStatus,
  type NotificationEventRecord,
} from './notifications.repository';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly deliveryQueue: string[] = [];
  private isProcessing = false;
  private processingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.processingInterval = setInterval(() => {
      this.processQueue().catch((err) => {
        this.logger.error(`Queue processor error: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, 2000);
  }

  health(): { status: string } {
    return { status: 'ok' };
  }

  async emit(input: {
    eventType: string;
    entityType: string;
    entityId: string;
    actorUserId?: string;
    payloadJson?: Record<string, unknown>;
  }): Promise<NotificationEventRecord> {
    const channels = this.resolveChannels();
    const created = await this.notificationsRepository.create({
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      actorUserId: input.actorUserId,
      payloadJson: input.payloadJson ?? {},
      channels,
      status: 'PENDING',
      deliveryAttempts: 0,
    });

    this.enqueue(created.id);
    await this.drainQueueForId(created.id);
    return (await this.notificationsRepository.getById(created.id))!;
  }

  private async drainQueueForId(id: string): Promise<void> {
    const maxDrainCycles = 10;
    this.isProcessing = true;
    try {
      for (let i = 0; i < maxDrainCycles; i++) {
        const record = await this.notificationsRepository.getById(id);
        if (!record || record.status !== 'PENDING') {
          return;
        }
        await this.dispatch(record);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private enqueue(id: string): void {
    this.deliveryQueue.push(id);
  }

  async flush(): Promise<void> {
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.deliveryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.deliveryQueue.length > 0) {
        const id = this.deliveryQueue.shift()!;
        try {
          const record = await this.notificationsRepository.getById(id);
          if (!record || record.status !== 'PENDING') {
            continue;
          }
          await this.dispatch(record);
        } catch (err) {
          this.logger.warn(`Failed to process notification ${id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  list(query?: { status?: NotificationDeliveryStatus; eventType?: string; limit?: number }) {
    return this.notificationsRepository.list(query);
  }

  async summary(): Promise<{ total: number; pending: number; delivered: number; failed: number }> {
    const [pending, delivered, failed] = await Promise.all([
      this.notificationsRepository.list({ status: 'PENDING', limit: 250 }),
      this.notificationsRepository.list({ status: 'DELIVERED', limit: 250 }),
      this.notificationsRepository.list({ status: 'FAILED', limit: 250 }),
    ]);
    return {
      pending: pending.length,
      delivered: delivered.length,
      failed: failed.length,
      total: pending.length + delivered.length + failed.length,
    };
  }

  async observability(): Promise<{
    generatedAt: string;
    windowSize: number;
    totals: { total: number; pending: number; delivered: number; failed: number };
    byChannel: Array<{ channel: string; total: number; pending: number; delivered: number; failed: number }>;
    digest: {
      total: number;
      delivered: number;
      failed: number;
      pending: number;
      latestDigestEventAt?: string;
    };
    backlog: {
      pendingOldestAgeMinutes: number;
      highRetryCount: number;
    };
  }> {
    const events = await this.notificationsRepository.list({ limit: 500 });
    const now = new Date();

    const totals = {
      total: events.length,
      pending: events.filter((entry) => entry.status === 'PENDING').length,
      delivered: events.filter((entry) => entry.status === 'DELIVERED').length,
      failed: events.filter((entry) => entry.status === 'FAILED').length,
    };

    const channelMap = new Map<string, { channel: string; total: number; pending: number; delivered: number; failed: number }>();
    for (const event of events) {
      for (const channel of event.channels) {
        const key = channel || 'IN_APP';
        const bucket = channelMap.get(key) ?? {
          channel: key,
          total: 0,
          pending: 0,
          delivered: 0,
          failed: 0,
        };
        bucket.total += 1;
        if (event.status === 'PENDING') {
          bucket.pending += 1;
        } else if (event.status === 'DELIVERED') {
          bucket.delivered += 1;
        } else if (event.status === 'FAILED') {
          bucket.failed += 1;
        }
        channelMap.set(key, bucket);
      }
    }

    const digestEvents = events.filter((entry) => entry.eventType.startsWith('PUBLIC_DIGEST_'));
    const latestDigestDate = digestEvents
      .map((entry) => new Date(entry.createdAt))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((left, right) => right.getTime() - left.getTime())[0];

    const pendingEvents = events.filter((entry) => entry.status === 'PENDING');
    const oldestPending = pendingEvents
      .map((entry) => new Date(entry.createdAt))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((left, right) => left.getTime() - right.getTime())[0];

    const pendingOldestAgeMinutes = oldestPending
      ? Math.max(0, Math.floor((now.getTime() - oldestPending.getTime()) / (60 * 1000)))
      : 0;

    return {
      generatedAt: now.toISOString(),
      windowSize: events.length,
      totals,
      byChannel: Array.from(channelMap.values()).sort((left, right) => right.total - left.total),
      digest: {
        total: digestEvents.length,
        delivered: digestEvents.filter((entry) => entry.status === 'DELIVERED').length,
        failed: digestEvents.filter((entry) => entry.status === 'FAILED').length,
        pending: digestEvents.filter((entry) => entry.status === 'PENDING').length,
        latestDigestEventAt: latestDigestDate?.toISOString(),
      },
      backlog: {
        pendingOldestAgeMinutes,
        highRetryCount: events.filter((entry) => entry.deliveryAttempts >= 3).length,
      },
    };
  }

  async retry(id: string): Promise<NotificationEventRecord> {
    await this.notificationsRepository.getById(id);
    const reset = await this.notificationsRepository.updateDelivery(id, {
      status: 'PENDING',
      deliveryAttempts: 0,
      lastError: undefined,
      deliveredAt: undefined,
    });
    return this.dispatch(reset);
  }

  private async dispatch(record: NotificationEventRecord): Promise<NotificationEventRecord> {
    const attempt = record.deliveryAttempts + 1;

    try {
      await this.deliverThroughChannels(record);
      return await this.notificationsRepository.updateDelivery(record.id, {
        status: 'DELIVERED',
        deliveryAttempts: attempt,
        deliveredAt: new Date().toISOString(),
        lastError: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown notification dispatch error';
      const maxAttempts = this.resolveMaxAttempts();

      if (attempt >= maxAttempts) {
        return await this.notificationsRepository.updateDelivery(record.id, {
          status: 'FAILED',
          deliveryAttempts: attempt,
          deliveredAt: undefined,
          lastError: message,
        });
      }

      const updated = await this.notificationsRepository.updateDelivery(record.id, {
        status: 'PENDING',
        deliveryAttempts: attempt,
        deliveredAt: undefined,
        lastError: message,
      });

      this.enqueue(updated.id);
      return updated;
    }
  }

  private resolveChannels(): string[] {
    const raw = this.configService.get<string>('notificationChannels') ?? process.env.NOTIFICATION_CHANNELS;
    if (!raw || raw.trim().length === 0) {
      return ['IN_APP'];
    }

    const channels = raw
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0);

    return channels.length > 0 ? Array.from(new Set(channels)) : ['IN_APP'];
  }

  private resolveMaxAttempts(): number {
    const raw = this.configService.get<number>('notificationRetryMaxAttempts') ?? Number(process.env.NOTIFICATION_RETRY_MAX_ATTEMPTS ?? 3);
    if (!Number.isFinite(raw)) {
      return 3;
    }
    return Math.max(1, Math.min(10, Number(raw)));
  }

  private async deliverThroughChannels(record: NotificationEventRecord): Promise<void> {
    for (const channel of record.channels) {
      await this.deliverToChannel(channel, record);
    }
  }

  private async deliverToChannel(channel: string, record: NotificationEventRecord): Promise<void> {
    if (channel === 'IN_APP') {
      return;
    }

    if (channel === 'WEBHOOK') {
      const endpoint = this.configService.get<string>('notificationWebhookUrl') ?? process.env.NOTIFICATION_WEBHOOK_URL;
      if (!endpoint) {
        throw new Error('WEBHOOK channel configured without NOTIFICATION_WEBHOOK_URL.');
      }
      await this.postJson(endpoint, this.buildWebhookPayload(record, 'WEBHOOK'));
      return;
    }

    if (channel === 'TEAMS') {
      const endpoint =
        this.configService.get<string>('notificationTeamsWebhookUrl') ?? process.env.NOTIFICATION_TEAMS_WEBHOOK_URL;
      if (!endpoint) {
        throw new Error('TEAMS channel configured without NOTIFICATION_TEAMS_WEBHOOK_URL.');
      }
      await this.postJson(endpoint, this.buildWebhookPayload(record, 'TEAMS'));
      return;
    }

    if (channel === 'EMAIL') {
      const endpoint =
        this.configService.get<string>('notificationEmailWebhookUrl') ?? process.env.NOTIFICATION_EMAIL_WEBHOOK_URL;
      if (!endpoint) {
        throw new Error('EMAIL channel configured without NOTIFICATION_EMAIL_WEBHOOK_URL.');
      }
      await this.postJson(endpoint, this.buildWebhookPayload(record, 'EMAIL'));
      return;
    }

    throw new Error(`Unsupported notification channel: ${channel}`);
  }

  private buildWebhookPayload(record: NotificationEventRecord, channel: string): Record<string, unknown> {
    const digestView = this.toDigestView(record);

    if (digestView) {
      if (channel === 'EMAIL') {
        return this.buildEmailDigestPayload(record, digestView);
      }

      if (channel === 'TEAMS') {
        return this.buildTeamsDigestPayload(record, digestView);
      }

      if (channel === 'WEBHOOK') {
        return this.buildWebhookDigestPayload(record, digestView);
      }
    }

    return {
      channel,
      eventType: record.eventType,
      entityType: record.entityType,
      entityId: record.entityId,
      actorUserId: record.actorUserId,
      createdAt: record.createdAt,
      payload: record.payloadJson,
    };
  }

  private buildWebhookDigestPayload(
    record: NotificationEventRecord,
    digest: DigestNotificationView,
  ): Record<string, unknown> {
    return {
      channel: 'WEBHOOK',
      eventType: record.eventType,
      entityType: record.entityType,
      entityId: record.entityId,
      recipientEmail: digest.recipientEmail,
      frequency: digest.frequency,
      topics: digest.topics,
      watchKeywords: digest.watchKeywords,
      summary: this.buildDigestSummaryText(digest),
      matches: digest.matches,
      createdAt: record.createdAt,
    };
  }

  private buildEmailDigestPayload(
    record: NotificationEventRecord,
    digest: DigestNotificationView,
  ): Record<string, unknown> {
    const subject = `[Council Digest] ${digest.frequency === 'DAILY_DIGEST' ? 'Daily' : 'Weekly'} Watchlist Update`;
    const lines = this.buildDigestLines(digest);

    return {
      channel: 'EMAIL',
      template: 'public-digest-v1',
      to: digest.recipientEmail,
      subject,
      text: lines.join('\n'),
      metadata: {
        eventType: record.eventType,
        subscriptionId: record.entityId,
      },
    };
  }

  private buildTeamsDigestPayload(
    record: NotificationEventRecord,
    digest: DigestNotificationView,
  ): Record<string, unknown> {
    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: this.buildDigestSummaryText(digest),
      themeColor: '0F5D7A',
      title: `${digest.frequency === 'DAILY_DIGEST' ? 'Daily' : 'Weekly'} Council Watchlist Digest`,
      sections: [
        {
          activityTitle: `Subscriber: ${digest.recipientEmail}`,
          facts: [
            { name: 'Event', value: record.eventType },
            { name: 'Frequency', value: digest.frequency },
            { name: 'Topics', value: digest.topics.join(', ') || 'None' },
            { name: 'Keywords', value: digest.watchKeywords.join(', ') || 'All public items' },
          ],
          text: this.buildDigestLines(digest).join('\n'),
        },
      ],
    };
  }

  private buildDigestSummaryText(digest: DigestNotificationView): string {
    return `${digest.matches.length} matching public item(s) for ${digest.recipientEmail}`;
  }

  private buildDigestLines(digest: DigestNotificationView): string[] {
    const lines: string[] = [];
    lines.push(`Council watchlist digest for ${digest.recipientEmail}`);
    lines.push(`Frequency: ${digest.frequency}`);
    lines.push(`Topics: ${digest.topics.join(', ') || 'None'}`);
    lines.push(`Keywords: ${digest.watchKeywords.join(', ') || 'All public items'}`);
    lines.push('');
    lines.push(`Matches (${digest.matches.length}):`);

    for (const match of digest.matches.slice(0, 10)) {
      lines.push(`- [${match.topic}] ${match.title}`);
    }

    if (digest.matches.length > 10) {
      lines.push(`- +${digest.matches.length - 10} more`);
    }

    return lines;
  }

  private toDigestView(record: NotificationEventRecord): DigestNotificationView | null {
    if (!record.eventType.startsWith('PUBLIC_DIGEST_')) {
      return null;
    }

    const payload = record.payloadJson;
    const recipientEmail = typeof payload.recipientEmail === 'string' ? payload.recipientEmail : null;
    const frequency = typeof payload.frequency === 'string' ? payload.frequency : null;
    const topics = Array.isArray(payload.topics) ? payload.topics.filter((entry): entry is string => typeof entry === 'string') : [];
    const watchKeywords = Array.isArray(payload.watchKeywords)
      ? payload.watchKeywords.filter((entry): entry is string => typeof entry === 'string')
      : [];
    const matches = Array.isArray(payload.matches)
      ? payload.matches
          .map((entry) => {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
              return null;
            }
            const obj = entry as Record<string, unknown>;
            if (typeof obj.topic !== 'string' || typeof obj.title !== 'string' || typeof obj.id !== 'string') {
              return null;
            }
            return {
              topic: obj.topic,
              title: obj.title,
              id: obj.id,
              source: typeof obj.source === 'string' ? obj.source : 'unknown',
            };
          })
          .filter((entry): entry is { topic: string; title: string; id: string; source: string } => Boolean(entry))
      : [];

    if (!recipientEmail || !frequency) {
      return null;
    }

    return {
      recipientEmail,
      frequency,
      topics,
      watchKeywords,
      matches,
    };
  }

  private async postJson(url: string, payload: Record<string, unknown>): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Notification channel request failed with ${response.status}`);
    }
  }
}

interface DigestNotificationView {
  recipientEmail: string;
  frequency: string;
  topics: string[];
  watchKeywords: string[];
  matches: Array<{ topic: string; title: string; id: string; source: string }>;
}
