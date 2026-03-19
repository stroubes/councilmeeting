import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MeetingQueryDto } from './meeting-query.dto';

const SORT_FIELDS = ['title', 'startsAt', 'status'] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export class MeetingListQueryDto extends MeetingQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortField?: (typeof SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortDirection?: (typeof SORT_DIRECTIONS)[number];

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
  pageSize?: number;
}
