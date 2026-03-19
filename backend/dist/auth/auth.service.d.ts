import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import type { MicrosoftTokenClaims } from './interfaces/microsoft-token-claims.interface';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private readonly usersService;
    constructor(usersService: UsersService);
    health(): {
        status: string;
    };
    buildAuthenticatedUser(claims: MicrosoftTokenClaims): Promise<AuthenticatedUser>;
    buildBypassUser(input?: {
        oid?: string;
        email?: string;
        displayName?: string;
        roles?: string[];
        permissions?: string[];
    }): AuthenticatedUser;
    private resolveRoles;
    private normalizeRoles;
    private resolveEmail;
    private resolveDisplayName;
}
