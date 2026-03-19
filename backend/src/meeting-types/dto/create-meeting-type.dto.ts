import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMeetingTypeDto {
  @IsString()
  @MaxLength(100)
  code!: string;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isInCamera?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
