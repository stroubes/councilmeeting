import { IsIn, IsOptional, IsString } from 'class-validator';

export class SetMotionOutcomeDto {
  @IsIn(['CARRIED', 'DEFEATED', 'WITHDRAWN'])
  status!: 'CARRIED' | 'DEFEATED' | 'WITHDRAWN';

  @IsOptional()
  @IsString()
  resultNote?: string;
}
