import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { MicrosoftTokenVerifierService } from '../../auth/services/microsoft-token-verifier.service';
import { AuthService } from '../../auth/auth.service';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftSsoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenVerifier: MicrosoftTokenVerifierService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{
        headers: Record<string, string | undefined>;
        user?: AuthenticatedUser;
      }>();

    const authorizationHeader = request.headers.authorization;
    const nodeEnv = (this.configService.get<string>('nodeEnv') ?? 'development').toLowerCase();
    const bypassAllowedEnvs = this.configService.get<string[]>('authBypassAllowedEnvs') ?? ['development', 'test', 'local'];
    const bypassEnabled = this.configService.get<boolean>('authBypassEnabled') === true;
    const bypassRequested = request.headers['x-dev-bypass'] === 'true';

    if (bypassEnabled && bypassRequested && bypassAllowedEnvs.includes(nodeEnv)) {
      request.user = this.authService.buildBypassUser({
        oid: request.headers['x-dev-user-oid'],
        email: request.headers['x-dev-user-email'],
        displayName: request.headers['x-dev-user-name'],
        roles: splitHeaderList(request.headers['x-dev-roles']),
        permissions: splitHeaderList(request.headers['x-dev-permissions']),
      });
      return true;
    }

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const claims = await this.tokenVerifier.verifyAccessToken(token);
    request.user = await this.authService.buildAuthenticatedUser(claims);

    return true;
  }
}

function splitHeaderList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}
