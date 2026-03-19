import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMotionDto {
  @IsOptional()
  @IsString()
  agendaItemId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;
}
