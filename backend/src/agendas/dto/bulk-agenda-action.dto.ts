import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class BulkAgendaActionDto {
  @IsArray()
  @IsString({ each: true })
  agendaIds!: string[];

  @IsIn(['SUBMIT', 'PUBLISH'])
  action!: 'SUBMIT' | 'PUBLISH';

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}
