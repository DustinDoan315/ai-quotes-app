import { adminClient } from "../_shared/admin.ts";
import { jsonResponse, requireAuth } from "../_shared/ai.ts";

const REVENUECAT_SECRET_API_KEY = Deno.env.get("REVENUECAT_SECRET_API_KEY") ?? "";
const PRO_ENTITLEMENT_ID = "pro_access";

type RevenueCatEntitlement = {
  expires_date?: string | null;
};

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
  };
};

const isActiveEntitlement = (entitlement: RevenueCatEntitlement | undefined): boolean => {
  if (!entitlement) return false;
  if (!entitlement.expires_date) return true;

  const expiration = Date.parse(entitlement.expires_date);
  return Number.isFinite(expiration) && expiration > Date.now();
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  if (!REVENUECAT_SECRET_API_KEY) {
    console.error("[sync-subscription] Missing REVENUECAT_SECRET_API_KEY");
    return jsonResponse({ error: "Subscription sync is not configured" }, 500);
  }

  const subscriberUrl =
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(auth.userId)}`;

  let revenueCatResponse: Response;
  try {
    revenueCatResponse = await fetch(subscriberUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${REVENUECAT_SECRET_API_KEY}`,
      },
    });
  } catch (error) {
    console.error("[sync-subscription] RevenueCat request failed", error);
    return jsonResponse({ error: "Subscription provider unavailable" }, 502);
  }

  if (!revenueCatResponse.ok) {
    console.error(
      "[sync-subscription] RevenueCat returned an error",
      revenueCatResponse.status,
    );
    return jsonResponse({ error: "Subscription provider lookup failed" }, 502);
  }

  let payload: RevenueCatSubscriberResponse;
  try {
    payload = (await revenueCatResponse.json()) as RevenueCatSubscriberResponse;
  } catch {
    return jsonResponse({ error: "Invalid subscription provider response" }, 502);
  }

  const entitlement = payload.subscriber?.entitlements?.[PRO_ENTITLEMENT_ID];
  const isPro = isActiveEntitlement(entitlement);
  const expiresAt = entitlement?.expires_date ?? null;

  const { error } = await adminClient.from("user_subscriptions").upsert(
    {
      user_id: auth.userId,
      is_pro: isPro,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[sync-subscription] Database upsert failed", error);
    return jsonResponse({ error: "Subscription sync failed" }, 500);
  }

  return jsonResponse({ isPro, expiresAt });
});
