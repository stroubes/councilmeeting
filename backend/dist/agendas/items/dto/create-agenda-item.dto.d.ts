declare const AGENDA_ITEM_TYPES: readonly ["SECTION", "STAFF_REPORT", "MOTION", "BYLAW", "INFO_ITEM", "CONSENT_ITEM", "OTHER"];
export declare class CreateAgendaItemDto {
    itemType: (typeof AGENDA_ITEM_TYPES)[number];
    title: string;
    description?: string;
    parentItemId?: string;
    isInCamera?: boolean;
}
export {};
