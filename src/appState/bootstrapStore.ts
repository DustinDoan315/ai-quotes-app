import { create } from "zustand";

type BootstrapState = {
  authReady: boolean;
  configReady: boolean;
  authError: string | null;
  authRetrying: boolean;
  authRetryCount: number;
  setAuthReady: (ready: boolean) => void;
  setConfigReady: (ready: boolean) => void;
  setAuthError: (error: string | null) => void;
  setAuthRetrying: (retrying: boolean) => void;
  retryAuth: () => void;
};

export const useBootstrapStore = create<BootstrapState>((set) => ({
  authReady: false,
  configReady: false,
  authError: null,
  authRetrying: false,
  authRetryCount: 0,
  setAuthReady: (authReady) => set({ authReady }),
  setConfigReady: (configReady) => set({ configReady }),
  setAuthError: (authError) => set({ authError }),
  setAuthRetrying: (authRetrying) => set({ authRetrying }),
  retryAuth: () =>
    set((state) => ({
      authReady: false,
      authError: null,
      authRetrying: true,
      authRetryCount: state.authRetryCount + 1,
    })),
}));

export const selectBootstrapReady = (state: BootstrapState): boolean =>
  state.authReady && state.configReady;
