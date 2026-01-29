import { create } from 'zustand';

type AIState = {
  isGenerating: boolean;
  lastGeneratedAt: number | null;
  setIsGenerating: (isGenerating: boolean) => void;
  setLastGeneratedAt: (timestamp: number) => void;
};

export const useAIStore = create<AIState>((set) => ({
  isGenerating: false,
  lastGeneratedAt: null,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setLastGeneratedAt: (timestamp) => set({ lastGeneratedAt: timestamp }),
}));
