export interface AuthenticatedUser {
    id: string;
    microsoftOid: string;
    email: string;
    displayName: string;
    roles: string[];
    permissions: string[];
}
