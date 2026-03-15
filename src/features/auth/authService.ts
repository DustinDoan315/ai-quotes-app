import { getCurrentUserProfile, ensureUserProfile, updateUserProfile } from "@/services/supabase-auth";
import { useUserStore } from '@/appState/userStore';
import type { User } from "@supabase/supabase-js";

export const syncUserProfile = async (user: User | null) => {
  const store = useUserStore.getState();
  const { setProfile, setAuthState, setGuestDisplayName } = store;

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

  setAuthState("authenticated");

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
    setProfile(profile);
  }
};
