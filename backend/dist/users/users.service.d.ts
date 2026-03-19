import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { UsersRepository, type ManagedUserRecord } from './users.repository';
import type { UpsertUserDto } from './dto/upsert-user.dto';
export declare class UsersService {
    private readonly usersRepository;
    private readonly auditService;
    constructor(usersRepository: UsersRepository, auditService: AuditService);
    health(): {
        status: string;
    };
    list(): Promise<ManagedUserRecord[]>;
    findByOidOrEmail(microsoftOid: string, email: string): Promise<ManagedUserRecord | null>;
    upsert(dto: UpsertUserDto, actor: AuthenticatedUser): Promise<ManagedUserRecord>;
    assignRole(userId: string, roleCode: string, actor: AuthenticatedUser): Promise<ManagedUserRecord>;
    private ensureAdmin;
}
