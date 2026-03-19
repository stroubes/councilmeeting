import { httpGet } from './httpClient';
import type { ExecutiveKpiSnapshot } from './types/analytics.types';

export function getExecutiveKpis(): Promise<ExecutiveKpiSnapshot> {
  return httpGet<ExecutiveKpiSnapshot>('/analytics/executive-kpis');
}
