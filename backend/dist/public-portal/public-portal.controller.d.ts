import { CreatePublicSubscriptionDto } from './dto/create-public-subscription.dto';
import { UpdatePublicSubscriptionDto } from './dto/update-public-subscription.dto';
import { PublicPortalService } from './public-portal.service';
export declare class PublicPortalController {
    private readonly publicPortalService;
    constructor(publicPortalService: PublicPortalService);
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
    meetings(): Promise<import("../meetings/meetings.service").MeetingRecord[]>;
    agendas(): Promise<{
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
    reports(): Promise<import("../reports/reports.service").StaffReportRecord[]>;
    minutes(): Promise<import("../minutes/minutes.repository").MinutesRecord[]>;
    createSubscription(dto: CreatePublicSubscriptionDto): Promise<import("./public-subscriptions.repository").PublicSubscriptionRecord>;
    listSubscriptions(email: string): Promise<import("./public-subscriptions.repository").PublicSubscriptionRecord[]>;
    updateSubscription(id: string, dto: UpdatePublicSubscriptionDto): Promise<import("./public-subscriptions.repository").PublicSubscriptionRecord>;
    removeSubscription(id: string): Promise<{
        ok: true;
    }>;
    previewSubscription(id: string): Promise<{
        subscription: import("./public-subscriptions.repository").PublicSubscriptionRecord;
        matches: Array<{
            topic: string;
            title: string;
            id: string;
            source: "meeting" | "agenda" | "report" | "minutes";
        }>;
    }>;
    runDigestSweep(): Promise<{
        runAt: string;
        processed: number;
        delivered: number;
        skipped: number;
    }>;
}
