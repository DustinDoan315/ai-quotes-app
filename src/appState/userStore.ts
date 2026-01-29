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
  setPersona: (persona: Persona) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthState: (state: AuthState) => void;
  clearUser: () => void;
};

const initialState = {
  persona: null,
  profile: null,
  authState: "guest" as AuthState,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      setPersona: (persona) => set({ persona }),
      setProfile: (profile) => set({ profile }),
      setAuthState: (authState) => set({ authState }),
      clearUser: () => set(initialState),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ persona: state.persona }),
    },
  ),
);
