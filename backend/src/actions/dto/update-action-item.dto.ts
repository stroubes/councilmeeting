import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateActionItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'])
  status?: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
