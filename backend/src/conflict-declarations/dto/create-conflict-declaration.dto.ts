import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConflictDeclarationDto {
  @IsUUID()
  meetingId!: string;

  @IsOptional()
  @IsUUID()
  agendaItemId?: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}