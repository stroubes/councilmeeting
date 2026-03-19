import { MeetingQueryDto } from './meeting-query.dto';
declare const SORT_FIELDS: readonly ["title", "startsAt", "status"];
declare const SORT_DIRECTIONS: readonly ["asc", "desc"];
export declare class MeetingListQueryDto extends MeetingQueryDto {
    q?: string;
    sortField?: (typeof SORT_FIELDS)[number];
    sortDirection?: (typeof SORT_DIRECTIONS)[number];
    page?: number;
    pageSize?: number;
}
export {};
