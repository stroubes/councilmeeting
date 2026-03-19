declare const MEETING_STATUSES: readonly ["SCHEDULED", "IN_PROGRESS", "ADJOURNED", "CANCELLED", "COMPLETED"];
export declare class UpdateMeetingDto {
    title?: string;
    description?: string;
    meetingTypeCode?: string;
    startsAt?: string;
    endsAt?: string;
    location?: string;
    isPublic?: boolean;
    status?: (typeof MEETING_STATUSES)[number];
    videoUrl?: string;
    recurrenceGroupId?: string;
    recurrenceIndex?: number;
}
export {};
