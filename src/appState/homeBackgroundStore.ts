import { HOME_BACKGROUNDS } from "@/theme/homeBackgrounds";
import { create } from "zustand";

type HomeBackgroundState = {
  devBgIndex: number | null;
  cycleDevBg: () => void;
};

export const useHomeBackgroundStore = create<HomeBackgroundState>(
  (set, get) => ({
    devBgIndex: null,
    cycleDevBg: () => {
      if (!__DEV__) {
        return;
      }
      const prev = get().devBgIndex;
      if (prev === null) {
        set({ devBgIndex: 0 });
        return;
      }
      if (prev >= HOME_BACKGROUNDS.length - 1) {
        set({ devBgIndex: null });
        return;
      }
      set({ devBgIndex: prev + 1 });
    },
  }),
);
