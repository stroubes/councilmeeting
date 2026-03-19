"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicrosoftSsoGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../decorators/public.decorator");
const microsoft_token_verifier_service_1 = require("../../auth/services/microsoft-token-verifier.service");
const auth_service_1 = require("../../auth/auth.service");
const config_1 = require("@nestjs/config");
let MicrosoftSsoGuard = class MicrosoftSsoGuard {
    reflector;
    tokenVerifier;
    authService;
    configService;
    constructor(reflector, tokenVerifier, authService, configService) {
        this.reflector = reflector;
        this.tokenVerifier = tokenVerifier;
        this.authService = authService;
        this.configService = configService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context
            .switchToHttp()
            .getRequest();
        const authorizationHeader = request.headers.authorization;
        const isNonProduction = this.configService.get('nodeEnv') !== 'production';
        const bypassTokenUsed = authorizationHeader === 'Bearer dev-bypass-token';
        const bypassEnabled = this.configService.get('authBypassEnabled') === true ||
            process.env.AUTH_BYPASS_ENABLED === 'true';
        if ((bypassEnabled || bypassTokenUsed) && isNonProduction) {
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
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        const token = authorizationHeader.slice('Bearer '.length).trim();
        const claims = await this.tokenVerifier.verifyAccessToken(token);
        request.user = await this.authService.buildAuthenticatedUser(claims);
        return true;
    }
};
exports.MicrosoftSsoGuard = MicrosoftSsoGuard;
exports.MicrosoftSsoGuard = MicrosoftSsoGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        microsoft_token_verifier_service_1.MicrosoftTokenVerifierService,
        auth_service_1.AuthService,
        config_1.ConfigService])
], MicrosoftSsoGuard);
function splitHeaderList(raw) {
    if (!raw) {
        return [];
    }
    return raw
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
}
//# sourceMappingURL=microsoft-sso.guard.js.map