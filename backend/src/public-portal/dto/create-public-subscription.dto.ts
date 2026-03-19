import { IsArray, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SUBSCRIPTION_TOPICS = ['MEETINGS', 'AGENDAS', 'REPORTS', 'MINUTES', 'MOTIONS', 'BUDGET'] as const;
const SUBSCRIPTION_FREQUENCIES = ['IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST'] as const;

export class CreatePublicSubscriptionDto {
  @IsEmail()
  email!: string;

  @IsArray()
  @IsIn(SUBSCRIPTION_TOPICS, { each: true })
  topics!: Array<(typeof SUBSCRIPTION_TOPICS)[number]>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  watchKeywords?: string[];

  @IsIn(SUBSCRIPTION_FREQUENCIES)
  frequency!: (typeof SUBSCRIPTION_FREQUENCIES)[number];
}
