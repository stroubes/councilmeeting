import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoleDelegationDto {
  @IsString()
  @MinLength(1)
  delegateFromUserId!: string;

  @IsString()
  @MinLength(1)
  delegateToUserId!: string;

  @IsString()
  @MinLength(2)
  roleCode!: string;

  @IsISO8601()
  startsAt!: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;
}
