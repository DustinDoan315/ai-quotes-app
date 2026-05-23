import { getCurrentUser } from "@/services/supabase-auth";
import { useEffect, useState } from "react";

/** Returns a human-readable label for the social provider the user signed in with. */
export function useProfileAuthedPhone() {
  const [authProvider, setAuthProvider] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const user = await getCurrentUser();
      if (!user || cancelled) return;
      const identities = user.identities ?? [];
      let provider: string | null = null;
      if (identities.length > 0) {
        const lastUsed = identities.reduce((a, b) =>
          new Date(a.last_sign_in_at ?? 0) > new Date(b.last_sign_in_at ?? 0) ? a : b
        );
        provider = lastUsed.provider ?? null;
      } else {
        provider = (user.app_metadata?.provider as string | undefined) ?? null;
      }
      if (!provider || provider === "anonymous") {
        setAuthProvider(null);
        return;
      }
      const label =
        provider === "google" ? "Google" :
        provider === "apple" ? "Apple" :
        provider;
      setAuthProvider(label);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Keep the same return shape so ProfileAuthedView needs no change
  return { phoneDisplay: authProvider ? `Signed in with ${authProvider}` : null, phoneVerified: true };
}
