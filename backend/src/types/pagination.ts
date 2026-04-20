export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function normalizePagination(
  page?: number,
  limit?: number,
): { page: number; limit: number; offset: number } {
  const safeLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Number(limit))) : 20;
  const safePage = Number.isFinite(page) ? Math.max(1, Number(page)) : 1;
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
}

export function toPaginatedResult<T>(
  records: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data: records,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
