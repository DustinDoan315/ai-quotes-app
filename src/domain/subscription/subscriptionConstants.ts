export type SubscriptionPlanId = "free" | "pro";
export type PlanLimitConfig = {
  dailyAiLimit: number | null;
  dailyExportLimit: number | null;
};

export const SUBSCRIPTION_ENTITLEMENT_ID = "pro_access";

export const FREE_DAILY_AI_LIMIT = 2;
export const FREE_DAILY_EXPORT_LIMIT = 2;

export const PRO_DAILY_AI_LIMIT = Number.POSITIVE_INFINITY;
export const PRO_DAILY_EXPORT_LIMIT = Number.POSITIVE_INFINITY;

export const SUBSCRIPTION_WATERMARK_ENABLED_FOR_FREE = true;

export const ADVANCED_PERSONA_IDS: readonly string[] = [];

export const DEFAULT_PLAN_LIMITS: Record<SubscriptionPlanId, PlanLimitConfig> = {
  free: {
    dailyAiLimit: FREE_DAILY_AI_LIMIT,
    dailyExportLimit: FREE_DAILY_EXPORT_LIMIT,
  },
  pro: {
    dailyAiLimit: null,
    dailyExportLimit: null,
  },
};
