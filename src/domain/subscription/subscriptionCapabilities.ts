import {
  DEFAULT_PLAN_LIMITS,
  FREE_DAILY_AI_LIMIT,
  FREE_DAILY_EXPORT_LIMIT,
  type PlanLimitConfig,
  SUBSCRIPTION_WATERMARK_ENABLED_FOR_FREE,
  type SubscriptionPlanId,
} from "./subscriptionConstants";

export type SubscriptionCapabilities = {
  maxDailyAiGenerations: number;
  maxDailyExports: number;
  canUsePremiumThemes: boolean;
  canUseAdvancedPersona: boolean;
  hasWatermark: boolean;
};

export const getCapabilitiesForPlan = (
  plan: SubscriptionPlanId,
  planLimits?: Record<SubscriptionPlanId, PlanLimitConfig>,
): SubscriptionCapabilities => {
  const effectivePlanLimits = planLimits ?? DEFAULT_PLAN_LIMITS;

  if (plan === "pro") {
    return {
      maxDailyAiGenerations:
        effectivePlanLimits.pro.dailyAiLimit ?? Number.POSITIVE_INFINITY,
      maxDailyExports:
        effectivePlanLimits.pro.dailyExportLimit ?? Number.POSITIVE_INFINITY,
      canUsePremiumThemes: true,
      canUseAdvancedPersona: true,
      hasWatermark: false,
    };
  }

  return {
    maxDailyAiGenerations:
      effectivePlanLimits.free.dailyAiLimit ?? FREE_DAILY_AI_LIMIT,
    maxDailyExports:
      effectivePlanLimits.free.dailyExportLimit ?? FREE_DAILY_EXPORT_LIMIT,
    canUsePremiumThemes: false,
    canUseAdvancedPersona: false,
    hasWatermark: SUBSCRIPTION_WATERMARK_ENABLED_FOR_FREE,
  };
};
