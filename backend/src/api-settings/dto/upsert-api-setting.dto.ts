import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertApiSettingDto {
  @IsString()
  @MaxLength(100)
  key!: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsString()
  value!: string;

  @IsBoolean()
  isSecret!: boolean;
}
