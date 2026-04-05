import { getCurrentUserProfile, ensureUserProfile, updateUserProfile } from "@/services/supabase-auth";
import { isRevenueCatInitialized } from "@/services/paywall/nativeRevenueCat";
import { revenuecatClient } from "@/services/paywall/revenuecatClient";
import { useUserStore } from '@/appState/userStore';
import type { User } from "@supabase/supabase-js";

export const syncUserProfile = async (user: User | null) => {
  const store = useUserStore.getState();
  const { setProfile, setAuthState, setGuestDisplayName } = store;

  if (isRevenueCatInitialized()) {
    try {
      if (user && !user.is_anonymous) {
        await revenuecatClient.logIn(user.id);
      } else if (!user) {
        await revenuecatClient.logOut();
      }
    } catch (error) {
      console.error("Failed to sync RevenueCat user identity:", error);
    }
  }

  if (!user) {
    setProfile(null);
    setAuthState("guest");
    return;
  }

  if (user.is_anonymous) {
    setProfile(null);
    setAuthState("guest");
    return;
  }

  let profile = await getCurrentUserProfile();
  profile ??= await ensureUserProfile(user.id);
  if (profile) {
    const guestDisplayName = useUserStore.getState().guestDisplayName?.trim();
    if (guestDisplayName && !profile.display_name?.trim()) {
      const { data: updated } = await updateUserProfile(user.id, { display_name: guestDisplayName });
      if (updated) {
        profile = updated;
        setGuestDisplayName(null);
      }
    }
    useUserStore.setState({ profile, authState: "authenticated" });
  } else {
    setAuthState("authenticated");
  }
};
