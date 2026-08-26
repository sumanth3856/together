import { create } from 'zustand';

const TOAST_DISMISS_MS = 4000;
const TOAST_EXIT_MS = 250;

const toastTimers = new Map();

export const useUIStore = create((set, get) => ({
  toasts: [],
  setToastNotification: (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, ...notification }] }));
    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      toastTimers.delete(id);
      get().removeToast(id);
    }, TOAST_DISMISS_MS);
    toastTimers.set(id, timer);
  },
  removeToast: (id) => {
    const existingTimer = toastTimers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      toastTimers.delete(id);
    }
    const currentToasts = get().toasts;
    if (!currentToasts.some((t) => t.id === id)) return;

    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, TOAST_EXIT_MS);
  },

  incomingReaction: null,
  setIncomingReaction: (reaction) => set({ incomingReaction: reaction }),
}));
