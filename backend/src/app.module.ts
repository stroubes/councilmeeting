import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { MeetingsModule } from './meetings/meetings.module';
import { AgendasModule } from './agendas/agendas.module';
import { ReportsModule } from './reports/reports.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { MinutesModule } from './minutes/minutes.module';
import { PublicPortalModule } from './public-portal/public-portal.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { MicrosoftSsoGuard } from './core/guards/microsoft-sso.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { PermissionsGuard } from './core/guards/permissions.guard';
import { DatabaseModule } from './database/database.module';
import { TemplatesModule } from './templates/templates.module';
import { MotionsModule } from './motions/motions.module';
import { MeetingDisplayModule } from './meeting-display/meeting-display.module';
import { PresentationsModule } from './presentations/presentations.module';
import { MeetingTypesModule } from './meeting-types/meeting-types.module';
import { GovernanceModule } from './governance/governance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ApiSettingsModule } from './api-settings/api-settings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ResolutionsModule } from './resolutions/resolutions.module';
import { ActionsModule } from './actions/actions.module';
import { AttendeesModule } from './attendees/attendees.module';
import { VotesModule } from './votes/votes.module';
import { ConflictDeclarationsModule } from './conflict-declarations/conflict-declarations.module';
import { BylawsModule } from './bylaws/bylaws.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MeetingsModule,
    MeetingTypesModule,
    AgendasModule,
    ReportsModule,
    WorkflowsModule,
    MinutesModule,
    PublicPortalModule,
    HealthModule,
    AuditModule,
    TemplatesModule,
    MotionsModule,
    MeetingDisplayModule,
    PresentationsModule,
    GovernanceModule,
    NotificationsModule,
    ApiSettingsModule,
    AnalyticsModule,
    ResolutionsModule,
    ActionsModule,
    AttendeesModule,
    VotesModule,
    ConflictDeclarationsModule,
    BylawsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: MicrosoftSsoGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
