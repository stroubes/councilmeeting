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
exports.MicrosoftTokenVerifierService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jose_1 = require("jose");
let MicrosoftTokenVerifierService = class MicrosoftTokenVerifierService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async verifyAccessToken(token) {
        const tenantId = this.configService.get('microsoft.tenantId');
        const clientId = this.configService.get('microsoft.clientId');
        const apiAudience = this.configService.get('microsoft.apiAudience');
        if (!tenantId || !clientId) {
            throw new common_1.UnauthorizedException('Microsoft Identity is not configured');
        }
        const allowedAudiences = [clientId, apiAudience].filter((audience) => Boolean(audience));
        const jwks = (0, jose_1.createRemoteJWKSet)(new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`));
        const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
        let payload;
        try {
            const result = await (0, jose_1.jwtVerify)(token, jwks, {
                issuer,
                audience: allowedAudiences,
            });
            payload = result.payload;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid Microsoft access token');
        }
        if (typeof payload.oid !== 'string' || payload.oid.length === 0) {
            throw new common_1.UnauthorizedException('Token missing oid claim');
        }
        return payload;
    }
};
exports.MicrosoftTokenVerifierService = MicrosoftTokenVerifierService;
exports.MicrosoftTokenVerifierService = MicrosoftTokenVerifierService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MicrosoftTokenVerifierService);
//# sourceMappingURL=microsoft-token-verifier.service.js.map