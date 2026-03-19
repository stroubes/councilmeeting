export interface ManagedUserRecord {
  id: string;
  microsoftOid: string;
  email: string;
  displayName: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemRoleRecord {
  code: string;
  permissions: string[];
}
