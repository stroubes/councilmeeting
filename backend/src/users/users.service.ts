import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SYSTEM_ROLES } from '../core/constants/roles.constants';
import { AuditService } from '../audit/audit.service';
import { UsersRepository, type ManagedUserRecord } from './users.repository';
import type { UpsertUserDto } from './dto/upsert-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditService: AuditService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  list(): Promise<ManagedUserRecord[]> {
    return this.usersRepository.list();
  }

  findByOidOrEmail(microsoftOid: string, email: string): Promise<ManagedUserRecord | null> {
    return this.usersRepository.findByOidOrEmail(microsoftOid, email.toLowerCase());
  }

  async upsert(dto: UpsertUserDto, actor: AuthenticatedUser): Promise<ManagedUserRecord> {
    this.ensureAdmin(actor);
    const record = await this.usersRepository.upsert({
      microsoftOid: dto.microsoftOid,
      email: dto.email.toLowerCase(),
      displayName: dto.displayName,
      roles: dto.roles ?? [SYSTEM_ROLES.STAFF],
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

  async assignRole(userId: string, roleCode: string, actor: AuthenticatedUser): Promise<ManagedUserRecord> {
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

  private ensureAdmin(actor: AuthenticatedUser): void {
    if (!actor.roles.includes(SYSTEM_ROLES.ADMIN)) {
      throw new ForbiddenException('Admin role required');
    }
  }
}
