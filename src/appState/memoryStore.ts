import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { QuoteMemory, QuoteVisibility, QuoteImageOrientation } from "../types/memory";
import type { Quote } from "./quoteStore";

export type MemoryState = {
  _hasHydrated: boolean;
  memories: QuoteMemory[];
  createMemoryFromQuote: (params: {
    quote: Quote;
    ownerUserId: string | null;
    ownerGuestId: string | null;
    photoBackgroundUri: string | null;
    photoOrientation?: QuoteImageOrientation;
    styleFontId: "small" | "medium" | "large";
    styleColorSchemeId: "light" | "amber" | "pink";
  }) => QuoteMemory;
  addMemory: (memory: QuoteMemory) => void;
  toggleFavorite: (id: string) => void;
  setVisibility: (id: string, visibility: QuoteVisibility) => void;
  getMemoriesForDate: (date: string) => QuoteMemory[];
  getCalendarSummaryForMonth: (monthKey: string) => Record<string, { hasMine: boolean; hasFavorite: boolean }>;
  getMemoriesOnSameDayPastYears: (date: string) => QuoteMemory[];
  setHasHydrated: (value: boolean) => void;
};

const byCreatedAtDesc = (a: QuoteMemory, b: QuoteMemory) => (a.createdAt > b.createdAt ? -1 : 1);

const getMonthKeyFromDate = (date: string) => date.slice(0, 7);

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      memories: [],
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      createMemoryFromQuote: ({
        quote,
        ownerUserId,
        ownerGuestId,
        photoBackgroundUri,
        photoOrientation,
        styleFontId,
        styleColorSchemeId,
      }) => {
        const today = new Date(quote.createdAt).toISOString().split("T")[0];
        const createdAtIso = new Date(quote.createdAt).toISOString();
        return {
          id: `${today}-${quote.id}`,
          ownerUserId,
          ownerGuestId,
          date: today,
          quoteText: quote.text,
          author: null,
          personaId: quote.personaId ?? null,
          photoBackgroundUri,
          photoOrientation,
          styleFontId,
          styleColorSchemeId,
          createdAt: createdAtIso,
          visibility: "private",
          isFavorite: false,
        };
      },
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
      onRehydrateStorage: () => (state, err) => {
        if (err) return;
        useMemoryStore.getState().setHasHydrated(true);
      },
    },
  ),
);

