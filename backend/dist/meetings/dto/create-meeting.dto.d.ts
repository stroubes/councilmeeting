export declare class CreateMeetingDto {
    title: string;
    meetingTypeCode: string;
    startsAt: string;
    endsAt?: string;
    location?: string;
    description?: string;
    isPublic?: boolean;
    videoUrl?: string;
    recurrenceGroupId?: string;
    recurrenceIndex?: number;
}
