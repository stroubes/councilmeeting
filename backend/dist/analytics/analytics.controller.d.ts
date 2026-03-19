import { AnalyticsService, type ExecutiveKpiSnapshot } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    health(): {
        status: string;
    };
    executiveKpis(): Promise<ExecutiveKpiSnapshot>;
}
