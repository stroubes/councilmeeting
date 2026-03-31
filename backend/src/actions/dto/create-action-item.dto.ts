import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateActionItemDto {
  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsString()
  resolutionId?: string;

  @IsOptional()
  @IsString()
  motionId?: string;
}
