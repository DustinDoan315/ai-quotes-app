import { getCapabilitiesForPlan } from "./subscriptionCapabilities";
import { resolvePlanFromSnapshot, type SubscriptionSnapshot } from "./subscriptionResolver";

type GuardReason =
  | "ai_limit"
  | "export_limit"
  | "premium_theme"
  | "persona_locked";

export type GuardResult = {
  allowed: boolean;
  reason?: GuardReason;
};

export const createSubscriptionGuards = (snapshot: SubscriptionSnapshot | null) => {
  const plan = resolvePlanFromSnapshot(snapshot);
  const capabilities = getCapabilitiesForPlan(plan);

  const canGenerateQuote = (dailyCount: number): GuardResult => {
    if (dailyCount >= capabilities.maxDailyAiGenerations) {
      return { allowed: false, reason: "ai_limit" };
    }
    return { allowed: true };
  };

  const canExportQuote = (dailyCount: number): GuardResult => {
    if (dailyCount >= capabilities.maxDailyExports) {
      return { allowed: false, reason: "export_limit" };
    }
    return { allowed: true };
  };

  const canUseTheme = (isPremiumTheme: boolean): GuardResult => {
    if (isPremiumTheme && !capabilities.canUsePremiumThemes) {
      return { allowed: false, reason: "premium_theme" };
    }
    return { allowed: true };
  };

  const canUsePersonaLevel = (isAdvancedLevel: boolean): GuardResult => {
    if (isAdvancedLevel && !capabilities.canUseAdvancedPersona) {
      return { allowed: false, reason: "persona_locked" };
    }
    return { allowed: true };
  };

  return {
    plan,
    capabilities,
    canGenerateQuote,
    canExportQuote,
    canUseTheme,
    canUsePersonaLevel,
  };
};

