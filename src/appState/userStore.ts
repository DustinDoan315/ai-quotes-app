import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Persona = {
  id: string;
  traits: string[];
  preferences: Record<string, unknown>;
};

export function createStarterPersona(): Persona {
  return {
    id: "starter",
    traits: ["curious", "optimistic"],
    preferences: {
      stylePreference: "dark-minimal",
      goals: [],
    },
  };
}

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
export type UiLanguagePreference = "vi" | "en";

type UserState = {
  persona: Persona | null;
  onboardingCompleted: boolean;
  profile: UserProfile | null;
  authState: AuthState;
  /** Current Supabase user id, including anonymous users. Not persisted. */
  authUserId: string | null;
  guestId: string | null;
  guestDisplayName: string | null;
  inviteNudgeDismissed: boolean;
  quoteLanguage: QuoteLanguagePreference;
  uiLanguage: UiLanguagePreference;
  setPersona: (persona: Persona) => void;
  completeOnboarding: () => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthState: (state: AuthState) => void;
  setAuthUserId: (userId: string | null) => void;
  setGuestDisplayName: (name: string | null) => void;
  setInviteNudgeDismissed: (dismissed: boolean) => void;
  setQuoteLanguage: (lang: QuoteLanguagePreference) => void;
  setUiLanguage: (lang: UiLanguagePreference) => void;
  clearUser: () => void;
  ensureGuestId: () => string;
};

const initialState: Omit<
  UserState,
  | "setPersona"
  | "completeOnboarding"
  | "setProfile"
  | "setAuthState"
  | "setAuthUserId"
  | "setGuestDisplayName"
  | "setInviteNudgeDismissed"
  | "setQuoteLanguage"
  | "setUiLanguage"
  | "clearUser"
  | "ensureGuestId"
> =
  {
    persona: null,
    onboardingCompleted: false,
    profile: null,
    authState: "guest",
    authUserId: null,
    guestId: null,
    guestDisplayName: null,
    inviteNudgeDismissed: false,
    quoteLanguage: "en",
    uiLanguage: "en",
  };

const createGuestId = () =>
  `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setPersona: (persona) => set({ persona, onboardingCompleted: true }),
      completeOnboarding: () =>
        set({ persona: createStarterPersona(), onboardingCompleted: true }),
      setProfile: (profile) => set({ profile }),
      setAuthState: (authState) => set({ authState }),
      setAuthUserId: (authUserId) => set({ authUserId }),
      setGuestDisplayName: (guestDisplayName) => set({ guestDisplayName }),
      setInviteNudgeDismissed: (inviteNudgeDismissed) => set({ inviteNudgeDismissed }),
      setQuoteLanguage: (quoteLanguage) => set({ quoteLanguage }),
      setUiLanguage: (uiLanguage) => {
        set({ uiLanguage });
        i18n.changeLanguage(uiLanguage);
      },
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
      // Reset the old device/Vietnamese defaults once so existing installs
      // also open in English. Future explicit language changes remain persisted
      // and can still switch both UI and quote output.
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        persona: state.persona,
        onboardingCompleted: state.onboardingCompleted,
        guestId: state.guestId,
        guestDisplayName: state.guestDisplayName,
        inviteNudgeDismissed: state.inviteNudgeDismissed,
        quoteLanguage: state.quoteLanguage,
        uiLanguage: state.uiLanguage,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<UserState>;
        return {
          ...state,
          onboardingCompleted:
            state.onboardingCompleted ??
            Boolean(state.persona || state.profile || state.guestId),
          quoteLanguage: "en",
          uiLanguage: "en",
        };
      },
    },
  ),
);
