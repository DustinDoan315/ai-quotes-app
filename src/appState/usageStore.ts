import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  incrementUsageCounter,
  resetUsageForDate,
} from "@/domain/usage/usageState";

type UsageState = {
  dailyAiCount: number;
  dailyExportCount: number;
  lastResetDate: string | null;
  resetIfNewDay: () => void;
  incrementAiUsage: () => void;
  incrementExportUsage: () => void;
};

const getTodayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      dailyAiCount: 0,
      dailyExportCount: 0,
      lastResetDate: null,
      resetIfNewDay: () => {
        set(resetUsageForDate(get(), getTodayKey()));
      },
      incrementAiUsage: () => {
        set(incrementUsageCounter(get(), getTodayKey(), "dailyAiCount"));
      },
      incrementExportUsage: () => {
        set(incrementUsageCounter(get(), getTodayKey(), "dailyExportCount"));
      },
    }),
    {
      name: "usage-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dailyAiCount: state.dailyAiCount,
        dailyExportCount: state.dailyExportCount,
        lastResetDate: state.lastResetDate,
      }),
    },
  ),
);
