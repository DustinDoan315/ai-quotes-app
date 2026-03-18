import { create } from "zustand";

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

export const useUsageStore = create<UsageState>((set, get) => ({
  dailyAiCount: 0,
  dailyExportCount: 0,
  lastResetDate: null,
  resetIfNewDay: () => {
    const today = getTodayKey();
    const lastResetDate = get().lastResetDate;
    if (lastResetDate !== today) {
      set({
        dailyAiCount: 0,
        dailyExportCount: 0,
        lastResetDate: today,
      });
    }
  },
  incrementAiUsage: () => {
    const today = getTodayKey();
    const lastResetDate = get().lastResetDate;
    if (lastResetDate !== today) {
      set({
        dailyAiCount: 1,
        dailyExportCount: 0,
        lastResetDate: today,
      });
      return;
    }
    set((state) => ({
      dailyAiCount: state.dailyAiCount + 1,
      lastResetDate: today,
    }));
  },
  incrementExportUsage: () => {
    const today = getTodayKey();
    const lastResetDate = get().lastResetDate;
    if (lastResetDate !== today) {
      set({
        dailyAiCount: 0,
        dailyExportCount: 1,
        lastResetDate: today,
      });
      return;
    }
    set((state) => ({
      dailyExportCount: state.dailyExportCount + 1,
      lastResetDate: today,
    }));
  },
}));

