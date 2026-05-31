import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { ExpoSecureStorageAdapter } from "./secureStorage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] MISSING ENV VARS — EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "All Supabase requests will fail. For EAS builds, set these as EAS environment variables.",
  );
}

const isWebSsr = Platform.OS === "web" && globalThis.window === undefined;

const ssrSafeStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    autoRefreshToken: !isWebSsr,
    persistSession: !isWebSsr,
    detectSessionInUrl: false,
    storage: isWebSsr ? ssrSafeStorage : ExpoSecureStorageAdapter,
  },
});

export function checkSupabaseReachable(): void {
  if (!supabaseUrl) return;
  fetch(`${supabaseUrl}/rest/v1/`, {
    method: "HEAD",
    headers: { apikey: supabaseAnonKey ?? "" },
  }).catch(() => {
    console.error(
      "[Supabase] Project is unreachable. Common causes:\n" +
        "  1. Free-tier project is paused — resume it at https://supabase.com/dashboard\n" +
        "  2. EXPO_PUBLIC_SUPABASE_URL is wrong in your .env or EAS secrets\n" +
        "  3. No internet access to the Supabase endpoint",
    );
  });
}

export type Database = {
  public: {
    Tables: {
      ai_usage_daily: {
        Row: {
          user_id: string;
          usage_date: string;
          ai_count: number;
        };
        Insert: {
          user_id: string;
          usage_date?: string;
          ai_count?: number;
        };
        Update: {
          user_id?: string;
          usage_date?: string;
          ai_count?: number;
        };
      };
      home_backgrounds: {
        Row: {
          vibe_key: string;
          rarity: string;
          sort_order: number;
        };
        Insert: {
          vibe_key: string;
          rarity: string;
          sort_order?: number;
        };
        Update: {
          vibe_key?: string;
          rarity?: string;
          sort_order?: number;
        };
      };
      subscription_plan_settings: {
        Row: {
          plan_id: "free" | "pro";
          daily_ai_limit: number | null;
          daily_export_limit: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plan_id: "free" | "pro";
          daily_ai_limit?: number | null;
          daily_export_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: "free" | "pro";
          daily_ai_limit?: number | null;
          daily_export_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          home_vibe_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          home_vibe_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          home_vibe_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_photos: {
        Row: {
          id: string;
          user_id: string | null;
          guest_id: string | null;
          image_url: string;
          storage_path: string;
          home_vibe_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          image_url: string;
          storage_path: string;
          home_vibe_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          image_url?: string;
          storage_path?: string;
          home_vibe_key?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
