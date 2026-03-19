declare const SUBSCRIPTION_TOPICS: readonly ["MEETINGS", "AGENDAS", "REPORTS", "MINUTES", "MOTIONS", "BUDGET"];
declare const SUBSCRIPTION_FREQUENCIES: readonly ["IMMEDIATE", "DAILY_DIGEST", "WEEKLY_DIGEST"];
export declare class CreatePublicSubscriptionDto {
    email: string;
    topics: Array<(typeof SUBSCRIPTION_TOPICS)[number]>;
    watchKeywords?: string[];
    frequency: (typeof SUBSCRIPTION_FREQUENCIES)[number];
}
export {};
