import { create } from "zustand";

type BootstrapState = {
  authReady: boolean;
  configReady: boolean;
  setAuthReady: (ready: boolean) => void;
  setConfigReady: (ready: boolean) => void;
};

export const useBootstrapStore = create<BootstrapState>((set) => ({
  authReady: false,
  configReady: false,
  setAuthReady: (authReady) => set({ authReady }),
  setConfigReady: (configReady) => set({ configReady }),
}));

export const selectBootstrapReady = (state: BootstrapState): boolean =>
  state.authReady && state.configReady;
