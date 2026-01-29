import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';


type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastQuoteDate: string | null;
  incrementStreak: () => void;
  resetStreak: () => void;
  updateLastQuoteDate: (date: string) => void;
};

const getTodayString = () => new Date().toISOString().split("T")[0];

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastQuoteDate: null,
      incrementStreak: () => {
        const today = getTodayString();
        const state = get();

        if (state.lastQuoteDate === today) {
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split("T")[0];

        const newStreak =
          state.lastQuoteDate === yesterdayString ? state.currentStreak + 1 : 1;

        set({
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.longestStreak),
          lastQuoteDate: today,
        });
      },
      resetStreak: () =>
        set({
          currentStreak: 0,
          lastQuoteDate: null,
        }),
      updateLastQuoteDate: (date) => set({ lastQuoteDate: date }),
    }),
    {
      name: "streak-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
