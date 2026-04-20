import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const SEARCH_TYPES = ['meetings', 'agendas', 'reports', 'minutes', 'all'] as const;

export type SearchContentType = (typeof SEARCH_TYPES)[number];

export class SearchQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @IsIn(SEARCH_TYPES)
  type?: SearchContentType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
