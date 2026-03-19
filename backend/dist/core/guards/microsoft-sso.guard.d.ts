import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MicrosoftTokenVerifierService } from '../../auth/services/microsoft-token-verifier.service';
import { AuthService } from '../../auth/auth.service';
import { ConfigService } from '@nestjs/config';
export declare class MicrosoftSsoGuard implements CanActivate {
    private readonly reflector;
    private readonly tokenVerifier;
    private readonly authService;
    private readonly configService;
    constructor(reflector: Reflector, tokenVerifier: MicrosoftTokenVerifierService, authService: AuthService, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
