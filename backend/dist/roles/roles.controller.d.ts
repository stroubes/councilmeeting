import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    health(): {
        status: string;
    };
    list(): {
        code: "DIRECTOR" | "CAO" | "ADMIN" | "STAFF" | "COUNCIL_MEMBER";
        permissions: string[];
    }[];
}
