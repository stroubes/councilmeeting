"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicPortalService = void 0;
const common_1 = require("@nestjs/common");
const meetings_service_1 = require("../meetings/meetings.service");
const agendas_service_1 = require("../agendas/agendas.service");
const reports_service_1 = require("../reports/reports.service");
const minutes_service_1 = require("../minutes/minutes.service");
const notifications_service_1 = require("../notifications/notifications.service");
const public_subscriptions_repository_1 = require("./public-subscriptions.repository");
let PublicPortalService = class PublicPortalService {
    meetingsService;
    agendasService;
    reportsService;
    minutesService;
    publicSubscriptionsRepository;
    notificationsService;
    constructor(meetingsService, agendasService, reportsService, minutesService, publicSubscriptionsRepository, notificationsService) {
        this.meetingsService = meetingsService;
        this.agendasService = agendasService;
        this.reportsService = reportsService;
        this.minutesService = minutesService;
        this.publicSubscriptionsRepository = publicSubscriptionsRepository;
        this.notificationsService = notificationsService;
    }
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
        const publicAgendaItemIds = new Set(agendas
            .flatMap((agenda) => agenda.items)
            .filter((item) => !item.isInCamera && item.status === 'PUBLISHED')
            .map((item) => item.id));
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
    async createSubscription(dto) {
        return this.publicSubscriptionsRepository.create({
            email: dto.email.trim().toLowerCase(),
            topics: normalizeTopics(dto.topics),
            watchKeywords: normalizeKeywords(dto.watchKeywords),
            frequency: dto.frequency,
        });
    }
    async listSubscriptionsByEmail(email) {
        if (!email?.trim()) {
            return [];
        }
        return this.publicSubscriptionsRepository.listByEmail(email.trim().toLowerCase());
    }
    async updateSubscription(id, dto) {
        return this.publicSubscriptionsRepository.update(id, {
            topics: dto.topics ? normalizeTopics(dto.topics) : undefined,
            watchKeywords: dto.watchKeywords ? normalizeKeywords(dto.watchKeywords) : undefined,
            frequency: dto.frequency,
            isActive: dto.isActive,
        });
    }
    removeSubscription(id) {
        return this.publicSubscriptionsRepository.remove(id);
    }
    async previewSubscriptionAlerts(id) {
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
    async runDigestSweep(now = new Date()) {
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
    async runDigestForFrequency(frequency, now) {
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
    async getPublicDataSnapshot() {
        const [meetings, agendas, reports, minutes] = await Promise.all([
            this.listMeetings(),
            this.listAgendas(),
            this.listReports(),
            this.listMinutes(),
        ]);
        return { meetings, agendas, reports, minutes };
    }
};
exports.PublicPortalService = PublicPortalService;
exports.PublicPortalService = PublicPortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService,
        agendas_service_1.AgendasService,
        reports_service_1.ReportsService,
        minutes_service_1.MinutesService,
        public_subscriptions_repository_1.PublicSubscriptionsRepository,
        notifications_service_1.NotificationsService])
], PublicPortalService);
function isDigestDue(subscription, now, frequency) {
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
function collectMatches(subscription, data) {
    const matches = [];
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
            if (!subscription.topics.includes(topic)) {
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
function normalizeTopics(topics) {
    const allowed = new Set(['MEETINGS', 'AGENDAS', 'REPORTS', 'MINUTES', 'MOTIONS', 'BUDGET']);
    const normalized = topics
        .map((topic) => topic.trim().toUpperCase())
        .filter((topic) => allowed.has(topic));
    return Array.from(new Set(normalized));
}
function normalizeKeywords(keywords) {
    return Array.from(new Set((keywords ?? [])
        .map((keyword) => keyword.trim().toLowerCase())
        .filter((keyword) => keyword.length > 1)
        .slice(0, 20)));
}
function matchesKeywords(keywords, haystack) {
    if (keywords.length === 0) {
        return true;
    }
    const normalizedHaystack = haystack.toLowerCase();
    return keywords.some((keyword) => normalizedHaystack.includes(keyword));
}
function hasBudgetTerm(...values) {
    const combined = values.filter(Boolean).join(' ').toLowerCase();
    return combined.includes('budget') || combined.includes('financial plan');
}
//# sourceMappingURL=public-portal.service.js.map