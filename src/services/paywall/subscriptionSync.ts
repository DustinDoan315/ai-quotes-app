import { supabase } from "@/config/supabase";

export type ServerSubscriptionSync = {
  isPro: boolean;
  expiresAt: string | null;
};

/**
 * Reconciles the RevenueCat entitlement with the server-side subscription row.
 * The Edge Function derives the user id from the verified Supabase session;
 * no client-supplied user id is sent.
 */
export async function syncSubscriptionWithServer(): Promise<
  ServerSubscriptionSync | null
> {
  try {
    const { data, error } = await supabase.functions.invoke<ServerSubscriptionSync>(
      "sync-subscription",
    );

    if (error) {
      console.error("Failed to sync subscription with server", error);
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error("Failed to invoke subscription sync", error);
    return null;
  }
}
