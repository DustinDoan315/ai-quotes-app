import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.",
  );
}

const isWebSsr = Platform.OS === "web" && globalThis.window === undefined;

const ssrSafeStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: !isWebSsr,
    persistSession: !isWebSsr,
    detectSessionInUrl: false,
    storage: isWebSsr ? ssrSafeStorage : AsyncStorage,
  },
});

export type Database = {
  public: {
    Tables: {
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
