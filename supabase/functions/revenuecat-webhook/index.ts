import { adminClient } from "../_shared/admin.ts";
import { jsonResponse } from "../_shared/ai.ts";

const WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
const PRO_ENTITLEMENT_ID = "pro_access";

// Event types that grant or remove Pro access.
// RevenueCat docs: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
const GRANT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "NON_RENEWING_PURCHASE",
]);

const REVOKE_TYPES = new Set(["EXPIRATION"]);

type RevenueCatEvent = {
  type: string;
  app_user_id: string;
  original_app_user_id: string;
  entitlement_ids: string[] | null;
  expiration_at_ms: number | null;
};

type WebhookPayload = {
  event: RevenueCatEvent;
  api_version: string;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify shared secret sent by RevenueCat as Authorization: Bearer <secret>
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!WEBHOOK_SECRET || token !== WEBHOOK_SECRET) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const event = payload?.event;
  if (!event?.type || !event?.app_user_id) {
    return jsonResponse({ error: "Missing event fields" }, 400);
  }

  // Use original_app_user_id as the canonical Supabase user UUID; RevenueCat
  // can create alias IDs during anonymous-to-identified transitions.
  const userId = event.original_app_user_id || event.app_user_id;

  const expiresAt = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  let isPro: boolean | null = null;

  if (GRANT_TYPES.has(event.type)) {
    // Trust entitlement_ids from the event payload — RevenueCat sends the full
    // active set at the moment of the event.
    isPro = Array.isArray(event.entitlement_ids)
      ? event.entitlement_ids.includes(PRO_ENTITLEMENT_ID)
      : false;
  } else if (REVOKE_TYPES.has(event.type)) {
    isPro = false;
  }
  // CANCELLATION: user retains access until expiration, so we only update
  // expires_at — is_pro stays true until the EXPIRATION event fires.
  else if (event.type === "CANCELLATION") {
    const { error } = await adminClient
      .from("user_subscriptions")
      .update({ expires_at: expiresAt, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      console.error("[revenuecat-webhook] update expires_at error:", error);
      return jsonResponse({ error: "Database error" }, 500);
    }

    return jsonResponse({ ok: true });
  }

  // Ignore event types we don't act on (TEST, TRANSFER, SUBSCRIBER_ALIAS, etc.)
  if (isPro === null) {
    return jsonResponse({ ok: true });
  }

  const { error } = await adminClient.from("user_subscriptions").upsert(
    {
      user_id: userId,
      is_pro: isPro,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[revenuecat-webhook] upsert error:", error);
    return jsonResponse({ error: "Database error" }, 500);
  }

  return jsonResponse({ ok: true });
});
