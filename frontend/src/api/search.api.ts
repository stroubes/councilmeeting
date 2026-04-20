import { httpGet } from './httpClient';

export type SearchType = 'meetings' | 'agendas' | 'reports' | 'minutes' | 'all';

export interface SearchResult {
  id: string;
  type: 'meeting' | 'agenda' | 'report' | 'minutes';
  title: string;
  excerpt: string;
  rank: number;
}

export interface SearchResponse {
  data: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function searchContent(input: {
  q: string;
  type?: SearchType;
  page?: number;
  limit?: number;
}): Promise<SearchResponse> {
  const params = new URLSearchParams();
  params.set('q', input.q);
  if (input.type) {
    params.set('type', input.type);
  }
  if (input.page) {
    params.set('page', String(input.page));
  }
  if (input.limit) {
    params.set('limit', String(input.limit));
  }
  return httpGet<SearchResponse>(`/search?${params.toString()}`);
}
