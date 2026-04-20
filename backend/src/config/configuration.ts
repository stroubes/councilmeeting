export default () => ({
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
  authBypassAllowedEnvs: (process.env.AUTH_BYPASS_ALLOWED_ENVS ?? 'development,test,local')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  rateLimitGeneralMax: Number(process.env.RATE_LIMIT_GENERAL_MAX ?? 120),
  rateLimitPublicMax: Number(process.env.RATE_LIMIT_PUBLIC_MAX ?? 90),
  rateLimitAuthMax: Number(process.env.RATE_LIMIT_AUTH_MAX ?? 30),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:4173')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0),
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
