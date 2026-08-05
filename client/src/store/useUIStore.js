import { create } from 'zustand';

const TOAST_DISMISS_MS = 4000;
const TOAST_EXIT_MS = 250;

export const useUIStore = create((set) => ({
  toasts: [],
  setToastNotification: (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, ...notification }] }));
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      useUIStore.getState().removeToast(id);
    }, TOAST_DISMISS_MS);
  },
  removeToast: (id) => {
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
