import { httpGet } from './httpClient';

interface DatabaseHealth {
  status: 'up' | 'down' | 'disabled';
  message: string;
}

export interface SystemHealth {
  status: 'ok' | 'degraded';
  checks?: {
    database?: DatabaseHealth;
  };
}

export function getSystemHealth(): Promise<SystemHealth> {
  return httpGet<SystemHealth>('/health');
}
