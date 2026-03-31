import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateAttendeeDto {
  @IsOptional()
  @IsString()
  role?: 'CHAIR' | 'COUNCIL_MEMBER' | 'STAFF' | 'GUEST';

  @IsOptional()
  @IsString()
  status?: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | 'EARLY_DEPARTURE';

  @IsOptional()
  @IsString()
  arrivedAt?: string;

  @IsOptional()
  @IsString()
  departedAt?: string;

  @IsOptional()
  @IsBoolean()
  isConflictOfInterest?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}