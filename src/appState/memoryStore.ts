import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { QuoteMemory, QuoteVisibility } from "../types/memory";

type MemoryState = {
  memories: QuoteMemory[];
  addMemory: (memory: QuoteMemory) => void;
  toggleFavorite: (id: string) => void;
  setVisibility: (id: string, visibility: QuoteVisibility) => void;
  getMemoriesForDate: (date: string) => QuoteMemory[];
  getCalendarSummaryForMonth: (monthKey: string) => Record<string, { hasMine: boolean; hasFavorite: boolean }>;
  getMemoriesOnSameDayPastYears: (date: string) => QuoteMemory[];
};

const byCreatedAtDesc = (a: QuoteMemory, b: QuoteMemory) => (a.createdAt > b.createdAt ? -1 : 1);

const getMonthKeyFromDate = (date: string) => date.slice(0, 7);

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [],
      addMemory: (memory) =>
        set((state) => ({
          memories: [memory, ...state.memories].sort(byCreatedAtDesc).slice(0, 365 * 3),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id
              ? {
                  ...m,
                  isFavorite: !m.isFavorite,
                }
              : m,
          ),
        })),
      setVisibility: (id, visibility) =>
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id
              ? {
                  ...m,
                  visibility,
                }
              : m,
          ),
        })),
      getMemoriesForDate: (date) => {
        return get().memories.filter((m) => m.date === date);
      },
      getCalendarSummaryForMonth: (monthKey) => {
        const summary: Record<string, { hasMine: boolean; hasFavorite: boolean }> = {};
        get().memories.forEach((m) => {
          if (getMonthKeyFromDate(m.date) !== monthKey) {
            return;
          }
          const existing = summary[m.date];
          const hasFavorite = m.isFavorite || existing?.hasFavorite === true;
          const hasMine = true;
          summary[m.date] = { hasMine, hasFavorite };
        });
        return summary;
      },
      getMemoriesOnSameDayPastYears: (date) => {
        const target = new Date(date);
        const day = target.getDate();
        const month = target.getMonth();
        return get()
          .memories.filter((m) => {
            const d = new Date(m.date);
            return d.getDate() === day && d.getMonth() === month && m.date !== date;
          })
          .sort(byCreatedAtDesc);
      },
    }),
    {
      name: "memory-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        memories: state.memories,
      }),
    },
  ),
);

