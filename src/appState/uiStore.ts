import { create } from 'zustand';

export type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
};

let nextToastId = 0;

type Modal = {
  id: string;
  component: string;
  props?: Record<string, unknown>;
};

type UIState = {
  toasts: Toast[];
  modals: Modal[];
  loading: boolean;
  showToast: (message: string, type?: Toast["type"], duration?: number) => void;
  hideToast: (id: string) => void;
  showModal: (component: string, props?: Record<string, unknown>) => void;
  hideModal: (id: string) => void;
  setLoading: (loading: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  modals: [],
  loading: false,
  showToast: (message, type = "info", duration = 3000) => {
    const id = `toast-${Date.now()}-${nextToastId++}`;
    let wasAdded = false;
    set((state) => ({
      toasts: state.toasts.some(
        (toast) => toast.message === message && toast.type === type,
      )
        ? state.toasts
        : (() => {
            wasAdded = true;
            return [...state.toasts, { id, message, type, duration }];
          })(),
    }));
    if (!wasAdded) {
      return;
    }
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  hideToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  showModal: (component, props) => {
    const id = Date.now().toString();
    set((state) => ({
      modals: [...state.modals, { id, component, props }],
    }));
  },
  hideModal: (id) =>
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));
