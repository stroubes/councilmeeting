import { ConfigService } from '@nestjs/config';
import type { MicrosoftTokenClaims } from '../interfaces/microsoft-token-claims.interface';
export declare class MicrosoftTokenVerifierService {
    private readonly configService;
    constructor(configService: ConfigService);
    verifyAccessToken(token: string): Promise<MicrosoftTokenClaims>;
}
