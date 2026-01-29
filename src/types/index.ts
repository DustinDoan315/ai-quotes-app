export type { Quote } from "../appState/quoteStore";

type Persona = {
  id: string;
  traits: string[];
  preferences: Record<string, unknown>;
};

type UserProfile = {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type AuthState = "guest" | "authenticated" | "loading";

export type { AuthState, Persona, UserProfile };
