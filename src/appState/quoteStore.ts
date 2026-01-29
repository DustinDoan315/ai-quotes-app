import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';


export type Quote = {
  id: string;
  text: string;
  author?: string;
  personaId?: string;
  createdAt: number;
  imageUrl?: string;
};

type QuoteState = {
  dailyQuote: Quote | null;
  history: Quote[];
  savedQuotes: Quote[];
  recentQuoteIds: string[];
  setDailyQuote: (quote: Quote) => void;
  addToHistory: (quote: Quote) => void;
  saveQuote: (quote: Quote) => void;
  removeSavedQuote: (quoteId: string) => void;
  swapDailyQuote: (quote: Quote) => void;
};

const initialState = {
  dailyQuote: null,
  history: [],
  savedQuotes: [],
  recentQuoteIds: [],
};

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set) => ({
      ...initialState,
      setDailyQuote: (quote) => set({ dailyQuote: quote }),
      addToHistory: (quote) =>
        set((state) => ({
          history: [quote, ...state.history].slice(0, 100),
          recentQuoteIds: [quote.id, ...state.recentQuoteIds].slice(0, 50),
        })),
      saveQuote: (quote) =>
        set((state) => ({
          savedQuotes: [...state.savedQuotes, quote],
        })),
      removeSavedQuote: (quoteId) =>
        set((state) => ({
          savedQuotes: state.savedQuotes.filter((q) => q.id !== quoteId),
        })),
      swapDailyQuote: (quote) =>
        set((state) => ({
          dailyQuote: quote,
          history: [quote, ...state.history].slice(0, 100),
        })),
    }),
    {
      name: "quote-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedQuotes: state.savedQuotes,
        recentQuoteIds: state.recentQuoteIds,
      }),
    },
  ),
);
