import { useUserStore } from "@/appState/userStore";
import { syncUserProfile } from "@/features/auth/authService";
import { supabase } from "@/config/supabase";
import {
  getCurrentUserProfile,
  signInWithGoogle as signInWithGoogleApi,
  signInWithApple as signInWithAppleApi,
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
  signInWithGoogle: (idToken: string) => Promise<{ error: unknown }>;
  signInWithApple: (identityToken: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

  const handleSignInWithGoogle = async (idToken: string) => {
    const { user: newUser, session: newSession, error } = await signInWithGoogleApi(idToken);
    if (!error && newSession && newUser) {
      await syncUserProfile(newUser);
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      setUser(newUser);
      setSession(newSession);
    }
    return { error };
  };

  const handleSignInWithApple = async (identityToken: string) => {
    const { user: newUser, session: newSession, error } = await signInWithAppleApi(identityToken);
    if (!error && newSession && newUser) {
      await syncUserProfile(newUser);
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      setUser(newUser);
      setSession(newSession);
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
    updateProfile: handleUpdateProfile,
    refreshProfile,
  };
}
