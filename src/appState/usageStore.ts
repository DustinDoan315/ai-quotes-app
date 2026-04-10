import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  incrementUsageCounter,
  resetUsageForDate,
} from "@/domain/usage/usageState";
import { getTodayLocalDateKey } from "@/utils/dateKey";

type UsageState = {
  dailyAiCount: number;
  dailyExportCount: number;
  lastResetDate: string | null;
  resetIfNewDay: () => void;
  incrementAiUsage: () => void;
  incrementExportUsage: () => void;
};

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      dailyAiCount: 0,
      dailyExportCount: 0,
      lastResetDate: null,
      resetIfNewDay: () => {
        set(resetUsageForDate(get(), getTodayLocalDateKey()));
      },
      incrementAiUsage: () => {
        set(incrementUsageCounter(get(), getTodayLocalDateKey(), "dailyAiCount"));
      },
      incrementExportUsage: () => {
        set(incrementUsageCounter(get(), getTodayLocalDateKey(), "dailyExportCount"));
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
