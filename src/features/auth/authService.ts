import { getCurrentUserProfile } from '../../../services/supabase-auth';
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

  const profile = await getCurrentUserProfile();
  if (profile) {
    setProfile(profile);
  }
};
