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

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function getDisplayStreak(state: {
  currentStreak: number;
  lastQuoteDate: string | null;
}): number {
  const today = getTodayString();
  const yesterday = getYesterdayString();
  if (
    state.lastQuoteDate === today ||
    state.lastQuoteDate === yesterday
  ) {
    return state.currentStreak;
  }
  return 0;
}

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

        const yesterdayString = getYesterdayString();
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
      partialize: (state) => ({
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastQuoteDate: state.lastQuoteDate,
      }),
    },
  ),
);
