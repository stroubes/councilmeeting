"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const rbac_map_constants_1 = require("../core/constants/rbac-map.constants");
const roles_constants_1 = require("../core/constants/roles.constants");
let RolesService = class RolesService {
    health() {
        return { status: 'ok' };
    }
    list() {
        return Object.values(roles_constants_1.SYSTEM_ROLES).map((code) => ({
            code,
            permissions: rbac_map_constants_1.ROLE_PERMISSION_MAP[code] ?? [],
        }));
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)()
], RolesService);
//# sourceMappingURL=roles.service.js.map