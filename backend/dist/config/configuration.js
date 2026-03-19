"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    municipalProfileId: process.env.MUNICIPAL_PROFILE_ID ?? 'BC_BASELINE',
    notificationChannels: process.env.NOTIFICATION_CHANNELS ?? 'IN_APP',
    notificationWebhookUrl: process.env.NOTIFICATION_WEBHOOK_URL,
    notificationTeamsWebhookUrl: process.env.NOTIFICATION_TEAMS_WEBHOOK_URL,
    notificationEmailWebhookUrl: process.env.NOTIFICATION_EMAIL_WEBHOOK_URL,
    notificationRetryMaxAttempts: Number(process.env.NOTIFICATION_RETRY_MAX_ATTEMPTS ?? 3),
    notificationRetryBaseDelayMs: Number(process.env.NOTIFICATION_RETRY_BASE_DELAY_MS ?? 400),
    publicDigestSchedulerEnabled: process.env.PUBLIC_DIGEST_SCHEDULER_ENABLED !== 'false',
    publicDigestSchedulerIntervalMs: Number(process.env.PUBLIC_DIGEST_SCHEDULER_INTERVAL_MS ?? 600000),
    authBypassEnabled: process.env.AUTH_BYPASS_ENABLED === 'true',
    databaseUrl: process.env.DATABASE_URL,
    microsoft: {
        tenantId: process.env.MS_TENANT_ID,
        clientId: process.env.MS_CLIENT_ID,
        clientSecret: process.env.MS_CLIENT_SECRET,
        redirectUri: process.env.MS_REDIRECT_URI,
        apiAudience: process.env.MS_API_AUDIENCE,
    },
    sharepoint: {
        tenant: process.env.SHAREPOINT_TENANT,
        siteId: process.env.SHAREPOINT_SITE_ID,
        driveId: process.env.SHAREPOINT_DRIVE_ID,
    },
});
//# sourceMappingURL=configuration.js.map