export declare class RolesService {
    health(): {
        status: string;
    };
    list(): {
        code: "DIRECTOR" | "CAO" | "ADMIN" | "STAFF" | "COUNCIL_MEMBER";
        permissions: string[];
    }[];
}
