"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSION_MAP = void 0;
const permissions_constants_1 = require("./permissions.constants");
const roles_constants_1 = require("./roles.constants");
const allPermissions = Object.values(permissions_constants_1.PERMISSIONS);
exports.ROLE_PERMISSION_MAP = {
    [roles_constants_1.SYSTEM_ROLES.ADMIN]: allPermissions,
    [roles_constants_1.SYSTEM_ROLES.STAFF]: [
        permissions_constants_1.PERMISSIONS.MEETING_READ,
        permissions_constants_1.PERMISSIONS.MEETING_WRITE,
        permissions_constants_1.PERMISSIONS.AGENDA_WRITE,
        permissions_constants_1.PERMISSIONS.REPORT_SUBMIT,
        permissions_constants_1.PERMISSIONS.MINUTES_WRITE,
    ],
    [roles_constants_1.SYSTEM_ROLES.DIRECTOR]: [
        permissions_constants_1.PERMISSIONS.MEETING_READ,
        permissions_constants_1.PERMISSIONS.MEETING_READ_IN_CAMERA,
        permissions_constants_1.PERMISSIONS.AGENDA_WRITE,
        permissions_constants_1.PERMISSIONS.REPORT_APPROVE_DIRECTOR,
        permissions_constants_1.PERMISSIONS.MINUTES_WRITE,
    ],
    [roles_constants_1.SYSTEM_ROLES.CAO]: [
        permissions_constants_1.PERMISSIONS.MEETING_READ,
        permissions_constants_1.PERMISSIONS.MEETING_READ_IN_CAMERA,
        permissions_constants_1.PERMISSIONS.AGENDA_WRITE,
        permissions_constants_1.PERMISSIONS.AGENDA_PUBLISH,
        permissions_constants_1.PERMISSIONS.REPORT_APPROVE_CAO,
        permissions_constants_1.PERMISSIONS.MINUTES_PUBLISH,
        permissions_constants_1.PERMISSIONS.PUBLIC_PUBLISH,
    ],
    [roles_constants_1.SYSTEM_ROLES.COUNCIL_MEMBER]: [
        permissions_constants_1.PERMISSIONS.MEETING_READ,
        permissions_constants_1.PERMISSIONS.MEETING_READ_IN_CAMERA,
        permissions_constants_1.PERMISSIONS.VOTE_RECORD,
    ],
};
//# sourceMappingURL=rbac-map.constants.js.map