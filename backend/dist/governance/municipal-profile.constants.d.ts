export type MunicipalBaselineProfile = 'BC_BASELINE' | 'AB_BASELINE' | 'ON_BASELINE';
export interface MunicipalProfile {
    id: MunicipalBaselineProfile;
    displayName: string;
    jurisdiction: string;
    requiresClosedSessionReason: boolean;
}
export declare const DEFAULT_MUNICIPAL_PROFILE: MunicipalProfile;
export declare const MUNICIPAL_PROFILES: MunicipalProfile[];
export type AgendaTemplateProfile = 'REGULAR_COUNCIL' | 'SPECIAL_COUNCIL' | 'COMMITTEE_OF_WHOLE' | 'IN_CAMERA';
export declare const REQUIRED_AGENDA_SECTION_TITLES: Record<AgendaTemplateProfile, string[]>;
export declare function inferAgendaTemplateProfile(template?: {
    code?: string;
    name?: string;
} | null): AgendaTemplateProfile;
