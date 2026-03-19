import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Permissions(PERMISSIONS.PUBLIC_PUBLISH)
  @Get('logs')
  list(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.auditService.listRecent(Number.isNaN(parsedLimit ?? NaN) ? undefined : parsedLimit);
  }
}
