import { supabase } from "@/config/supabase";
import type { SubscriptionPlanId } from "@/domain/subscription/subscriptionConstants";

export type SubscriptionPlanSettings = {
  planId: SubscriptionPlanId;
  dailyAiLimit: number | null;
  dailyExportLimit: number | null;
};

type SubscriptionPlanSettingsRow = {
  plan_id: SubscriptionPlanId;
  daily_ai_limit: number | null;
  daily_export_limit: number | null;
};

export async function fetchSubscriptionPlanSettings(): Promise<
  SubscriptionPlanSettings[] | null
> {
  const { data, error } = await supabase
    .from("subscription_plan_settings")
    .select("plan_id, daily_ai_limit, daily_export_limit");

  if (error) {
    console.error("Failed to load subscription plan settings", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (data as SubscriptionPlanSettingsRow[]).map((row) => ({
    planId: row.plan_id,
    dailyAiLimit: row.daily_ai_limit,
    dailyExportLimit: row.daily_export_limit,
  }));
}
