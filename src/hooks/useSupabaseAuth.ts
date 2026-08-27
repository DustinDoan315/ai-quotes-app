import { useUserStore } from "@/appState/userStore";
import { useMemoryStore } from "@/appState/memoryStore";
import { useStreakStore } from "@/appState/streakStore";
import { useSubscriptionStore } from "@/appState/subscriptionStore";
import { useUsageStore } from "@/appState/usageStore";
import { syncUserProfile } from "@/features/auth/authService";
import {
  getCurrentUserProfile,
  getSessionSafely,
  signInWithGoogle as signInWithGoogleApi,
  signInWithApple as signInWithAppleApi,
  deleteCurrentAccount,
  onAuthStateChange,
  signOutLocally,
  signOut,
  updateUserProfile,
  type UserProfile,
} from "@/services/supabase-auth";
import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (
    idToken: string,
    nonce?: string,
    accessToken?: string,
  ) => Promise<{ error: unknown }>;
  signInWithApple: (identityToken: string, nonce?: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  }) => Promise<{ error: unknown }>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionSafely().then(({ session, error }) => {
      if (error) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !profile) {
      getCurrentUserProfile().then(setProfile);
    }
  }, [user, profile]);

  const handleSignInWithGoogle = async (
    idToken: string,
    nonce?: string,
    accessToken?: string,
  ) => {
    const { user: newUser, session: newSession, error, upgradedAnonymousUser } =
      await signInWithGoogleApi(idToken, nonce, accessToken);
    if (!error && newSession && newUser) {
      if (upgradedAnonymousUser) {
        useMemoryStore
          .getState()
          .migrateGuestMemoriesToUser(useUserStore.getState().guestId, newUser.id);
      }
      await syncUserProfile(newUser);
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      setUser(newUser);
      setSession(newSession);
      if (userProfile) useUserStore.getState().setProfile(userProfile);
    }
    return { error };
  };

  const handleSignInWithApple = async (identityToken: string, nonce?: string) => {
    const { user: newUser, session: newSession, error, upgradedAnonymousUser } = await signInWithAppleApi(identityToken, nonce);
    if (!error && newSession && newUser) {
      if (upgradedAnonymousUser) {
        useMemoryStore
          .getState()
          .migrateGuestMemoriesToUser(useUserStore.getState().guestId, newUser.id);
      }
      await syncUserProfile(newUser);
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      setUser(newUser);
      setSession(newSession);
      if (userProfile) useUserStore.getState().setProfile(userProfile);
    }
    return { error };
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    setProfile(null);
    if (!error) {
      await syncUserProfile(null);
    }
    return { error };
  };

  const handleDeleteAccount = async (): Promise<{ error: Error | null }> => {
    const deletedUserId = user?.id ?? session?.user.id;
    const result = await deleteCurrentAccount();
    if (!result.deleted) {
      return { error: result.error };
    }

    // The server deletion succeeded. From this point forward, local cleanup is
    // best effort so a failed local logout cannot leave deleted account data in UI.
    await signOutLocally().catch(() => undefined);
    await syncUserProfile(null);

    if (deletedUserId) {
      useMemoryStore.getState().removeMemoriesForUser(deletedUserId);
    }
    useStreakStore.getState().clearStreak();
    useUsageStore.getState().clearUsage();
    useSubscriptionStore.getState().clearSubscription();
    useUserStore.getState().clearUser();

    setProfile(null);
    setSession(null);
    setUser(null);
    return { error: null };
  };

  const handleUpdateProfile = async (updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  }) => {
    if (!user) {
      return { error: { message: "No user logged in" } };
    }
    const { error } = await updateUserProfile(user.id, updates);
    if (!error) {
      const updatedProfile = await getCurrentUserProfile();
      setProfile(updatedProfile);
      if (updatedProfile) useUserStore.getState().setProfile(updatedProfile);
    }
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      if (userProfile) useUserStore.getState().setProfile(userProfile);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    signOut: handleSignOut,
    deleteAccount: handleDeleteAccount,
    updateProfile: handleUpdateProfile,
    refreshProfile,
  };
}
