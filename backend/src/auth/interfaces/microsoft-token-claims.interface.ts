export interface MicrosoftTokenClaims {
  oid: string;
  tid?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  roles?: string[];
  groups?: string[];
  aud?: string;
  iss?: string;
  [key: string]: unknown;
}
