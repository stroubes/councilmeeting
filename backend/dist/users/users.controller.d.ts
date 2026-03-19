import { UsersService } from './users.service';
import { UpsertUserDto } from './dto/upsert-user.dto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AssignRoleDto } from './dto/assign-role.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    health(): {
        status: string;
    };
    list(): Promise<import("./users.repository").ManagedUserRecord[]>;
    upsert(dto: UpsertUserDto, user: AuthenticatedUser): Promise<import("./users.repository").ManagedUserRecord>;
    assignRole(id: string, dto: AssignRoleDto, user: AuthenticatedUser): Promise<import("./users.repository").ManagedUserRecord>;
}
