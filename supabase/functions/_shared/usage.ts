import { adminClient } from "./admin.ts";
import { jsonResponse } from "./ai.ts";

const FREE_DAILY_AI_LIMIT = 2;

export class UsageLimitError extends Error {
  readonly status = 429;
  readonly reason = "ai_limit";
  constructor() {
    super("Daily AI limit reached");
  }
}

async function getIsPro(userId: string): Promise<boolean> {
  const { data } = await adminClient
    .from("user_subscriptions")
    .select("is_pro, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.is_pro) return false;
  if (!data.expires_at) return true;
  return new Date(data.expires_at) > new Date();
}

// Checks server-authoritative Pro status, then atomically increments the
// daily AI usage counter and throws UsageLimitError if the free cap is hit.
export async function assertAndIncrementUsage(userId: string): Promise<void> {
  const isPro = await getIsPro(userId);
  if (isPro) return;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await adminClient.rpc("increment_ai_usage", {
    p_user_id: userId,
    p_date: today,
  });

  if (error) {
    console.error("[usage] increment_ai_usage error:", error);
    throw new Error("Usage check failed");
  }

  if ((data as number) > FREE_DAILY_AI_LIMIT) {
    throw new UsageLimitError();
  }
}

export function usageLimitResponse(): Response {
  return jsonResponse({ error: "Daily AI limit reached", reason: "ai_limit" }, 429);
}
