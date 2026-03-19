import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    health(): {
        status: string;
    };
    me(user: AuthenticatedUser): AuthenticatedUser;
}
