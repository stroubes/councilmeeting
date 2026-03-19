import { IsString, MaxLength } from 'class-validator';

export class RejectReportDto {
  @IsString()
  @MaxLength(2000)
  comments!: string;
}
