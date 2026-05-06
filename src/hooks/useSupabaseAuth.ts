import { useUserStore } from "@/appState/userStore";
import { syncUserProfile } from "@/features/auth/authService";
import { supabase } from "@/config/supabase";
import {
  getCurrentUserProfile,
  getOAuthSignInUrl,
  signOut,
  updateUserProfile,
  type UserProfile,
} from "@/services/supabase-auth";
import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithOAuth: (provider: "google" | "apple") => Promise<{ error: unknown }>;
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Stale or revoked refresh token — clear it so the user lands on the sign-in screen
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
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

  const handleSignInWithOAuth = async (provider: "google" | "apple") => {
    const redirectTo = Linking.createURL("/auth/callback");
    const { url, error: urlError } = await getOAuthSignInUrl(provider, redirectTo);
    if (urlError || !url) return { error: urlError ?? new Error("No OAuth URL") };

    const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
    if (result.type !== "success") return { error: null };

    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
    if (!sessionError && sessionData?.session && sessionData?.user) {
      await syncUserProfile(sessionData.user);
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      if (userProfile) useUserStore.getState().setProfile(userProfile);
    }
    return { error: sessionError };
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
    signInWithOAuth: handleSignInWithOAuth,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    refreshProfile,
  };
}
