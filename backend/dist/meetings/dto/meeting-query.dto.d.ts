declare const MEETING_STATUSES: readonly ["SCHEDULED", "IN_PROGRESS", "ADJOURNED", "CANCELLED", "COMPLETED"];
export declare class MeetingQueryDto {
    inCamera?: string;
    publicOnly?: string;
    status?: (typeof MEETING_STATUSES)[number];
}
export {};
