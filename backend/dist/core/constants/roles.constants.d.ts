export declare const SYSTEM_ROLES: {
    readonly ADMIN: "ADMIN";
    readonly STAFF: "STAFF";
    readonly DIRECTOR: "DIRECTOR";
    readonly CAO: "CAO";
    readonly COUNCIL_MEMBER: "COUNCIL_MEMBER";
};
export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
