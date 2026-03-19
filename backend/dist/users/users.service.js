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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const roles_constants_1 = require("../core/constants/roles.constants");
const audit_service_1 = require("../audit/audit.service");
const users_repository_1 = require("./users.repository");
let UsersService = class UsersService {
    usersRepository;
    auditService;
    constructor(usersRepository, auditService) {
        this.usersRepository = usersRepository;
        this.auditService = auditService;
    }
    health() {
        return { status: 'ok' };
    }
    list() {
        return this.usersRepository.list();
    }
    findByOidOrEmail(microsoftOid, email) {
        return this.usersRepository.findByOidOrEmail(microsoftOid, email.toLowerCase());
    }
    async upsert(dto, actor) {
        this.ensureAdmin(actor);
        const record = await this.usersRepository.upsert({
            microsoftOid: dto.microsoftOid,
            email: dto.email.toLowerCase(),
            displayName: dto.displayName,
            roles: dto.roles ?? [roles_constants_1.SYSTEM_ROLES.STAFF],
        });
        await this.auditService.log({
            actorUserId: actor.id,
            action: 'users.upsert',
            entityType: 'managed_user',
            entityId: record.id,
            changesJson: { roles: record.roles, email: record.email },
        });
        return record;
    }
    async assignRole(userId, roleCode, actor) {
        this.ensureAdmin(actor);
        const user = await this.usersRepository.getById(userId);
        if (user.roles.includes(roleCode)) {
            return user;
        }
        const updated = await this.usersRepository.upsert({
            microsoftOid: user.microsoftOid,
            email: user.email,
            displayName: user.displayName,
            roles: [...user.roles, roleCode],
        });
        await this.auditService.log({
            actorUserId: actor.id,
            action: 'users.assign_role',
            entityType: 'managed_user',
            entityId: updated.id,
            changesJson: { roleCode },
        });
        return updated;
    }
    ensureAdmin(actor) {
        if (!actor.roles.includes(roles_constants_1.SYSTEM_ROLES.ADMIN)) {
            throw new common_1.ForbiddenException('Admin role required');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map