import type { TemplateRecord } from '../api/types/template.types';

export type AgendaTemplateProfile = 'REGULAR_COUNCIL' | 'SPECIAL_COUNCIL' | 'COMMITTEE_OF_WHOLE' | 'IN_CAMERA';

export const MUNICIPAL_PROFILE = {
  id: 'BC_BASELINE',
  name: 'BC Municipal Baseline',
  jurisdiction: 'British Columbia',
} as const;

export const REQUIRED_AGENDA_SECTION_TITLES: Record<AgendaTemplateProfile, string[]> = {
  REGULAR_COUNCIL: [
    'Call to Order',
    'Approval of Agenda',
    'Disclosure of Pecuniary Interest',
    'Adoption of Previous Minutes',
    'Staff Reports and Correspondence',
    'Bylaws',
    'Confirming Bylaw',
    'Adjournment',
  ],
  SPECIAL_COUNCIL: [
    'Call to Order',
    'Approval of Agenda',
    'Disclosure of Pecuniary Interest',
    'Special Business',
    'Confirming Bylaw',
    'Adjournment',
  ],
  COMMITTEE_OF_WHOLE: [
    'Call to Order',
    'Approval of Agenda',
    'Disclosure of Pecuniary Interest',
    'Staff Reports and Discussion Items',
    'Recommendations to Council',
    'Adjournment',
  ],
  IN_CAMERA: [
    'Call to Order',
    'Approval of In-Camera Agenda',
    'Disclosure of Pecuniary Interest',
    'Closed Session Authority',
    'In-Camera Discussion Items',
    'Rise and Report',
    'Adjournment',
  ],
};

export function inferAgendaTemplateProfile(template?: Pick<TemplateRecord, 'code' | 'name'> | null): AgendaTemplateProfile {
  const source = `${template?.code ?? ''} ${template?.name ?? ''}`.toLowerCase();
  if (source.includes('in camera') || source.includes('in-camera') || source.includes('incamera') || source.includes('closed')) {
    return 'IN_CAMERA';
  }
  if (source.includes('committee of the whole') || source.includes('c.o.w') || source.includes('cow')) {
    return 'COMMITTEE_OF_WHOLE';
  }
  if (source.includes('special')) {
    return 'SPECIAL_COUNCIL';
  }
  return 'REGULAR_COUNCIL';
}

export function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
