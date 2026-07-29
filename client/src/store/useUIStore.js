import { create } from 'zustand';

export const useUIStore = create((set) => ({
  toasts: [],
  setToastNotification: (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, ...notification }] }));
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  
  incomingReaction: null,
  setIncomingReaction: (reaction) => set({ incomingReaction: reaction }),
}));
