import { IsIn } from 'class-validator';
import { MUNICIPAL_PROFILES } from '../municipal-profile.constants';

const PROFILE_IDS = MUNICIPAL_PROFILES.map((profile) => profile.id);

export class SetActiveProfileDto {
  @IsIn(PROFILE_IDS)
  profileId!: (typeof PROFILE_IDS)[number];
}
