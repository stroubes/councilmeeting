import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePresentationDto {
  @IsString()
  meetingId!: string;

  @IsString()
  @MaxLength(500)
  fileName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  mimeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsString()
  contentBase64!: string;
}
