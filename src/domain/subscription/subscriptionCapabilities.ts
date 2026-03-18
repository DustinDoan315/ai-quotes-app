import {
  FREE_DAILY_AI_LIMIT,
  FREE_DAILY_EXPORT_LIMIT,
  PRO_DAILY_AI_LIMIT,
  PRO_DAILY_EXPORT_LIMIT,
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
): SubscriptionCapabilities => {
  if (plan === "pro") {
    return {
      maxDailyAiGenerations: PRO_DAILY_AI_LIMIT,
      maxDailyExports: PRO_DAILY_EXPORT_LIMIT,
      canUsePremiumThemes: true,
      canUseAdvancedPersona: true,
      hasWatermark: false,
    };
  }

  return {
    maxDailyAiGenerations: FREE_DAILY_AI_LIMIT,
    maxDailyExports: FREE_DAILY_EXPORT_LIMIT,
    canUsePremiumThemes: false,
    canUseAdvancedPersona: false,
    hasWatermark: SUBSCRIPTION_WATERMARK_ENABLED_FOR_FREE,
  };
};

