export interface PaginatedResponse<TRecord> {
  data: TRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
