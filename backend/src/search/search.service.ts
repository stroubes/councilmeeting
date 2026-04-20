import { Injectable } from '@nestjs/common';
import { PostgresService } from '../database/postgres.service';
import { normalizePagination, toPaginatedResult, type PaginatedResult } from '../types/pagination';
import type { SearchContentType, SearchQueryDto } from './dto/search-query.dto';

export interface SearchResultRecord {
  id: string;
  type: 'meeting' | 'agenda' | 'report' | 'minutes';
  title: string;
  excerpt: string;
  rank: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly postgresService: PostgresService) {}

  async search(query: SearchQueryDto): Promise<PaginatedResult<SearchResultRecord>> {
    const term = query.q?.trim();
    if (!term) {
      return toPaginatedResult([], 0, 1, 20);
    }

    if (!this.postgresService.isEnabled) {
      return toPaginatedResult([], 0, query.page ?? 1, query.limit ?? 20);
    }

    const pagination = normalizePagination(query.page, query.limit);
    const selectedType: SearchContentType = query.type ?? 'all';
    const searchConfig = 'english';
    const tsQuerySql = `websearch_to_tsquery('${searchConfig}', $1)`;

    const fragments: string[] = [];
    const params: unknown[] = [term];

    if (selectedType === 'all' || selectedType === 'meetings') {
      fragments.push(
        `SELECT id::text AS id, 'meeting'::text AS type, title,
            ts_headline('${searchConfig}', coalesce(title, ''), ${tsQuerySql}) AS excerpt,
            ts_rank(search_vector, ${tsQuerySql}) AS rank
         FROM app_meetings
         WHERE search_vector @@ ${tsQuerySql}`,
      );
    }

    if (selectedType === 'all' || selectedType === 'agendas') {
      fragments.push(
        `SELECT id::text AS id, 'agenda'::text AS type, title,
            ts_headline('${searchConfig}', coalesce(title, ''), ${tsQuerySql}) AS excerpt,
            ts_rank(search_vector, ${tsQuerySql}) AS rank
         FROM app_agendas
         WHERE search_vector @@ ${tsQuerySql}`,
      );
    }

    if (selectedType === 'all' || selectedType === 'reports') {
      fragments.push(
        `SELECT id::text AS id, 'report'::text AS type, title,
            ts_headline('${searchConfig}', coalesce(title, ''), ${tsQuerySql}) AS excerpt,
            ts_rank(search_vector, ${tsQuerySql}) AS rank
         FROM app_staff_reports
         WHERE search_vector @@ ${tsQuerySql}`,
      );
    }

    if (selectedType === 'all' || selectedType === 'minutes') {
      fragments.push(
        `SELECT id::text AS id, 'minutes'::text AS type,
            coalesce('Minutes ' || id::text, 'Minutes') AS title,
            ts_headline('${searchConfig}', coalesce(search_document, ''), ${tsQuerySql}) AS excerpt,
            ts_rank(search_vector, ${tsQuerySql}) AS rank
         FROM app_minutes
         WHERE search_vector @@ ${tsQuerySql}`,
      );
    }

    if (fragments.length === 0) {
      return toPaginatedResult([], 0, pagination.page, pagination.limit);
    }

    const unionSql = fragments.join(' UNION ALL ');
    const countSql = `SELECT COUNT(*)::int AS total FROM (${unionSql}) search_rows`;
    const countResult = await this.postgresService.query<{ total: number }>(countSql, params);
    const total = Number(countResult.rows[0]?.total ?? 0);

    const rowsSql = `
      SELECT id, type, title, excerpt, rank
      FROM (${unionSql}) search_rows
      ORDER BY rank DESC, title ASC
      LIMIT $2 OFFSET $3
    `;
    const rowsResult = await this.postgresService.query<SearchResultRecord>(rowsSql, [term, pagination.limit, pagination.offset]);

    return toPaginatedResult(rowsResult.rows, total, pagination.page, pagination.limit);
  }
}
