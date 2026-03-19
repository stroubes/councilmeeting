import { AgendasService } from '../agendas/agendas.service';
import { MinutesService } from '../minutes/minutes.service';
import { MeetingsService } from '../meetings/meetings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportsService } from '../reports/reports.service';
export interface MonthlyPublicationSlice {
    month: string;
    agendas: number;
    reports: number;
    minutes: number;
}
export interface ExecutiveKpiSnapshot {
    generatedAt: string;
    totals: {
        meetings: number;
        agendas: number;
        reports: number;
        minutes: number;
    };
    approvals: {
        directorPending: number;
        caoPending: number;
        totalPending: number;
    };
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
export declare class AnalyticsService {
    private readonly meetingsService;
    private readonly agendasService;
    private readonly reportsService;
    private readonly minutesService;
    private readonly notificationsService;
    constructor(meetingsService: MeetingsService, agendasService: AgendasService, reportsService: ReportsService, minutesService: MinutesService, notificationsService: NotificationsService);
    health(): {
        status: string;
    };
    executiveKpis(): Promise<ExecutiveKpiSnapshot>;
    private systemViewUser;
}
