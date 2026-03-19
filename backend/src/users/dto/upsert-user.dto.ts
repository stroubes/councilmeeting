import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertUserDto {
  @IsString()
  @MinLength(3)
  microsoftOid!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsOptional()
  @IsArray()
  roles?: string[];
}
