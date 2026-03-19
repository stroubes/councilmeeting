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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const rbac_map_constants_1 = require("../core/constants/rbac-map.constants");
const roles_constants_1 = require("../core/constants/roles.constants");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    health() {
        return { status: 'ok' };
    }
    async buildAuthenticatedUser(claims) {
        const email = this.resolveEmail(claims);
        const managed = await this.usersService.findByOidOrEmail(claims.oid, email);
        const roles = managed?.roles?.length ? this.normalizeRoles(managed.roles) : this.resolveRoles(claims);
        const permissions = Array.from(new Set(roles.flatMap((role) => rbac_map_constants_1.ROLE_PERMISSION_MAP[role] ?? [])));
        return {
            id: claims.oid,
            microsoftOid: claims.oid,
            email,
            displayName: managed?.displayName ?? this.resolveDisplayName(claims, email),
            roles,
            permissions,
        };
    }
    buildBypassUser(input) {
        const roles = this.normalizeRoles(input?.roles);
        const defaultPermissions = roles.flatMap((role) => rbac_map_constants_1.ROLE_PERMISSION_MAP[role] ?? []);
        const permissions = Array.from(new Set(input?.permissions?.length ? input.permissions : defaultPermissions));
        const email = input?.email?.trim().toLowerCase() || 'dev.user@municipality.local';
        const oid = input?.oid?.trim() || 'dev-bypass-user';
        return {
            id: oid,
            microsoftOid: oid,
            email,
            displayName: input?.displayName?.trim() || 'Local Dev User',
            roles,
            permissions,
        };
    }
    resolveRoles(claims) {
        const fromClaims = Array.isArray(claims.roles)
            ? claims.roles
                .filter((role) => typeof role === 'string')
                .map((role) => role.toUpperCase())
            : [];
        const validRoles = fromClaims.filter((role) => Object.values(roles_constants_1.SYSTEM_ROLES).includes(role));
        if (validRoles.length > 0) {
            return validRoles;
        }
        return [roles_constants_1.SYSTEM_ROLES.STAFF];
    }
    normalizeRoles(roles) {
        const normalized = (roles ?? [])
            .filter((role) => typeof role === 'string')
            .map((role) => role.toUpperCase())
            .filter((role) => Object.values(roles_constants_1.SYSTEM_ROLES).includes(role));
        if (normalized.length > 0) {
            return Array.from(new Set(normalized));
        }
        return [roles_constants_1.SYSTEM_ROLES.ADMIN];
    }
    resolveEmail(claims) {
        const raw = claims.email ?? claims.preferred_username;
        if (typeof raw === 'string' && raw.length > 0) {
            return raw.toLowerCase();
        }
        return `${claims.oid}@local.invalid`;
    }
    resolveDisplayName(claims, fallback) {
        if (typeof claims.name === 'string' && claims.name.length > 0) {
            return claims.name;
        }
        const givenName = typeof claims.given_name === 'string' ? claims.given_name : '';
        const familyName = typeof claims.family_name === 'string' ? claims.family_name : '';
        const combined = `${givenName} ${familyName}`.trim();
        if (combined.length > 0) {
            return combined;
        }
        return fallback;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map