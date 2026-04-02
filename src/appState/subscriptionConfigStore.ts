import { create } from "zustand";

import {
  DEFAULT_PLAN_LIMITS,
  type PlanLimitConfig,
  type SubscriptionPlanId,
} from "@/domain/subscription/subscriptionConstants";
import {
  fetchSubscriptionPlanSettings,
  type SubscriptionPlanSettings,
} from "@/services/subscription/subscriptionPlanSettings";

type SubscriptionConfigState = {
  planLimits: Record<SubscriptionPlanId, PlanLimitConfig>;
  hasLoadedRemoteConfig: boolean;
  loadPlanLimits: () => Promise<void>;
};

function mergePlanSettings(
  settings: SubscriptionPlanSettings[],
): Record<SubscriptionPlanId, PlanLimitConfig> {
  const next: Record<SubscriptionPlanId, PlanLimitConfig> = {
    free: { ...DEFAULT_PLAN_LIMITS.free },
    pro: { ...DEFAULT_PLAN_LIMITS.pro },
  };

  settings.forEach((setting) => {
    next[setting.planId] = {
      dailyAiLimit: setting.dailyAiLimit,
      dailyExportLimit: setting.dailyExportLimit,
    };
  });

  return next;
}

export const useSubscriptionConfigStore = create<SubscriptionConfigState>()(
  (set) => ({
    planLimits: {
      free: { ...DEFAULT_PLAN_LIMITS.free },
      pro: { ...DEFAULT_PLAN_LIMITS.pro },
    },
    hasLoadedRemoteConfig: false,
    loadPlanLimits: async () => {
      const settings = await fetchSubscriptionPlanSettings();
      if (!settings) {
        set({ hasLoadedRemoteConfig: true });
        return;
      }

      set({
        planLimits: mergePlanSettings(settings),
        hasLoadedRemoteConfig: true,
      });
    },
  }),
);
