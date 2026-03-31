import { IsOptional, IsString } from 'class-validator';

export class UpdateConflictDeclarationDto {
  @IsOptional()
  @IsString()
  reason?: string;
}