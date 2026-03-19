import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { MicrosoftTokenClaims } from '../interfaces/microsoft-token-claims.interface';

@Injectable()
export class MicrosoftTokenVerifierService {
  constructor(private readonly configService: ConfigService) {}

  async verifyAccessToken(token: string): Promise<MicrosoftTokenClaims> {
    const tenantId = this.configService.get<string>('microsoft.tenantId');
    const clientId = this.configService.get<string>('microsoft.clientId');
    const apiAudience = this.configService.get<string>('microsoft.apiAudience');

    if (!tenantId || !clientId) {
      throw new UnauthorizedException('Microsoft Identity is not configured');
    }

    const allowedAudiences = [clientId, apiAudience].filter(
      (audience): audience is string => Boolean(audience),
    );

    const jwks = createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`),
    );

    const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

    let payload: JWTPayload;

    try {
      const result = await jwtVerify(token, jwks, {
        issuer,
        audience: allowedAudiences,
      });
      payload = result.payload;
    } catch {
      throw new UnauthorizedException('Invalid Microsoft access token');
    }

    if (typeof payload.oid !== 'string' || payload.oid.length === 0) {
      throw new UnauthorizedException('Token missing oid claim');
    }

    return payload as MicrosoftTokenClaims;
  }
}
