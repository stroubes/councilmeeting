declare const REPORT_STATUSES: readonly ["DRAFT", "PENDING_DIRECTOR_APPROVAL", "PENDING_CAO_APPROVAL", "APPROVED", "REJECTED", "PUBLISHED"];
export declare class ReportQueryDto {
    agendaItemId?: string;
    status?: (typeof REPORT_STATUSES)[number];
}
export {};
