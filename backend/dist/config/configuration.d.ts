declare const _default: () => {
    nodeEnv: string;
    port: number;
    municipalProfileId: string;
    notificationChannels: string;
    notificationWebhookUrl: string | undefined;
    notificationTeamsWebhookUrl: string | undefined;
    notificationEmailWebhookUrl: string | undefined;
    notificationRetryMaxAttempts: number;
    notificationRetryBaseDelayMs: number;
    publicDigestSchedulerEnabled: boolean;
    publicDigestSchedulerIntervalMs: number;
    authBypassEnabled: boolean;
    databaseUrl: string | undefined;
    microsoft: {
        tenantId: string | undefined;
        clientId: string | undefined;
        clientSecret: string | undefined;
        redirectUri: string | undefined;
        apiAudience: string | undefined;
    };
    sharepoint: {
        tenant: string | undefined;
        siteId: string | undefined;
        driveId: string | undefined;
    };
};
export default _default;
