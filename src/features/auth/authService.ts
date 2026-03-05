import { getCurrentUserProfile, ensureUserProfile } from '../../../services/supabase-auth';
import { useUserStore } from '@/appState/userStore';
import type { User } from "@supabase/supabase-js";

export const syncUserProfile = async (user: User | null) => {
  const { setProfile, setAuthState } = useUserStore.getState();

  if (!user) {
    setProfile(null);
    setAuthState("guest");
    return;
  }

  setAuthState("authenticated");

  let profile = await getCurrentUserProfile();
  if (!profile) {
    profile = await ensureUserProfile(user.id);
  }
  if (profile) {
    setProfile(profile);
  }
};
