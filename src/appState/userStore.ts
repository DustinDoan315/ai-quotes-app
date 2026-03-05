import AsyncStorage from '@react-native-async-storage/async-storage';
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
  created_at: string;
  updated_at: string;
};

type AuthState = "guest" | "authenticated" | "loading";

type UserState = {
  persona: Persona | null;
  profile: UserProfile | null;
  authState: AuthState;
  guestId: string | null;
  inviteNudgeDismissed: boolean;
  setPersona: (persona: Persona) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthState: (state: AuthState) => void;
  setInviteNudgeDismissed: (dismissed: boolean) => void;
  clearUser: () => void;
  ensureGuestId: () => string;
};

const initialState: Omit<UserState, "setPersona" | "setProfile" | "setAuthState" | "setInviteNudgeDismissed" | "clearUser" | "ensureGuestId"> =
  {
    persona: null,
    profile: null,
    authState: "guest",
    guestId: null,
    inviteNudgeDismissed: false,
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
      setInviteNudgeDismissed: (inviteNudgeDismissed) => set({ inviteNudgeDismissed }),
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
      partialize: (state) => ({ persona: state.persona, guestId: state.guestId, inviteNudgeDismissed: state.inviteNudgeDismissed }),
    },
  ),
);
