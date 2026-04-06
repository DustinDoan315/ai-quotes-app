import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceAppLanguage, type SupportedAppLanguage } from "@/utils/appLanguage";
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  home_vibe_key: string | null;
  created_at: string;
  updated_at: string;
};

type AuthState = "guest" | "authenticated" | "loading";

export type QuoteLanguagePreference = "vi" | "en";
export type AppLanguagePreference = SupportedAppLanguage;

type UserState = {
  persona: Persona | null;
  profile: UserProfile | null;
  authState: AuthState;
  guestId: string | null;
  guestDisplayName: string | null;
  inviteNudgeDismissed: boolean;
  appLanguage: AppLanguagePreference;
  quoteLanguage: QuoteLanguagePreference;
  setPersona: (persona: Persona) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthState: (state: AuthState) => void;
  setGuestDisplayName: (name: string | null) => void;
  setInviteNudgeDismissed: (dismissed: boolean) => void;
  setAppLanguage: (lang: AppLanguagePreference) => void;
  setQuoteLanguage: (lang: QuoteLanguagePreference) => void;
  clearUser: () => void;
  ensureGuestId: () => string;
};

const defaultLanguage = getDeviceAppLanguage();

const initialState: Omit<UserState, "setPersona" | "setProfile" | "setAuthState" | "setGuestDisplayName" | "setInviteNudgeDismissed" | "setAppLanguage" | "setQuoteLanguage" | "clearUser" | "ensureGuestId"> =
  {
    persona: null,
    profile: null,
    authState: "guest",
    guestId: null,
    guestDisplayName: null,
    inviteNudgeDismissed: false,
    appLanguage: defaultLanguage,
    quoteLanguage: defaultLanguage,
  };

const createGuestId = () =>
  `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setPersona: (persona) => set({ persona }),
      setProfile: (profile) => set({ profile }),
      setAuthState: (authState) => set({ authState }),
      setGuestDisplayName: (guestDisplayName) => set({ guestDisplayName }),
      setInviteNudgeDismissed: (inviteNudgeDismissed) => set({ inviteNudgeDismissed }),
      setAppLanguage: (appLanguage) => set({ appLanguage }),
      setQuoteLanguage: (quoteLanguage) => set({ quoteLanguage }),
      clearUser: () => set(initialState),
      ensureGuestId: () => {
        const current = get().guestId;
        if (current) {
          return current;
        }
        const next = createGuestId();
        set({ guestId: next });
        return next;
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ persona: state.persona, guestId: state.guestId, guestDisplayName: state.guestDisplayName, inviteNudgeDismissed: state.inviteNudgeDismissed, appLanguage: state.appLanguage, quoteLanguage: state.quoteLanguage }),
    },
  ),
);
