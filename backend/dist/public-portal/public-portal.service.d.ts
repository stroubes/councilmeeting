import { MeetingsService } from '../meetings/meetings.service';
import { AgendasService } from '../agendas/agendas.service';
import { ReportsService } from '../reports/reports.service';
import { MinutesService } from '../minutes/minutes.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreatePublicSubscriptionDto } from './dto/create-public-subscription.dto';
import type { UpdatePublicSubscriptionDto } from './dto/update-public-subscription.dto';
import { type PublicSubscriptionRecord, PublicSubscriptionsRepository } from './public-subscriptions.repository';
export declare class PublicPortalService {
    private readonly meetingsService;
    private readonly agendasService;
    private readonly reportsService;
    private readonly minutesService;
    private readonly publicSubscriptionsRepository;
    private readonly notificationsService;
    constructor(meetingsService: MeetingsService, agendasService: AgendasService, reportsService: ReportsService, minutesService: MinutesService, publicSubscriptionsRepository: PublicSubscriptionsRepository, notificationsService: NotificationsService);
    summary(): Promise<{
        meetings: import("../meetings/meetings.service").MeetingRecord[];
        agendas: {
            items: import("../agendas/agendas.service").AgendaItemRecord[];
            id: string;
            meetingId: string;
            templateId?: string;
            title: string;
            status: import("../agendas/agendas.service").AgendaStatus;
            version: number;
            rejectionReason?: string;
            createdBy: string;
            createdAt: string;
            updatedAt: string;
            publishedAt?: string;
        }[];
        reports: import("../reports/reports.service").StaffReportRecord[];
        minutes: import("../minutes/minutes.repository").MinutesRecord[];
        counts: {
            meetings: number;
            agendas: number;
            reports: number;
            minutes: number;
        };
    }>;
    listMeetings(): Promise<import("../meetings/meetings.service").MeetingRecord[]>;
    listAgendas(): Promise<{
        items: import("../agendas/agendas.service").AgendaItemRecord[];
        id: string;
        meetingId: string;
        templateId?: string;
        title: string;
        status: import("../agendas/agendas.service").AgendaStatus;
        version: number;
        rejectionReason?: string;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }[]>;
    listReports(): Promise<import("../reports/reports.service").StaffReportRecord[]>;
    listMinutes(): Promise<import("../minutes/minutes.repository").MinutesRecord[]>;
    createSubscription(dto: CreatePublicSubscriptionDto): Promise<PublicSubscriptionRecord>;
    listSubscriptionsByEmail(email?: string): Promise<PublicSubscriptionRecord[]>;
    updateSubscription(id: string, dto: UpdatePublicSubscriptionDto): Promise<PublicSubscriptionRecord>;
    removeSubscription(id: string): Promise<void>;
    previewSubscriptionAlerts(id: string): Promise<{
        subscription: PublicSubscriptionRecord;
        matches: Array<{
            topic: string;
            title: string;
            id: string;
            source: 'meeting' | 'agenda' | 'report' | 'minutes';
        }>;
    }>;
    runDigestSweep(now?: Date): Promise<{
        runAt: string;
        processed: number;
        delivered: number;
        skipped: number;
    }>;
    private runDigestForFrequency;
    private getPublicDataSnapshot;
}
