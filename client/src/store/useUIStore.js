import { create } from 'zustand';

const TOAST_DISMISS_MS = 4000;
const TOAST_EXIT_MS = 250;

const toastTimers = new Map();

function applyThemeToDOM(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // Add temporary transition class for smooth theme switching
  root.classList.add('theme-transitioning');
  
  root.setAttribute('data-theme', theme);
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
  
  // Update meta theme-color for browser chromes
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a0c12');
  }
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (metaColorScheme) {
    metaColorScheme.setAttribute('content', theme);
  }

  // Remove transition class after animation finishes
  setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 250);
}

export const useUIStore = create((set, get) => ({
  theme: 'dark',
  
  initTheme: () => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem('beingus-theme');
      if (saved === 'light' || saved === 'dark') {
        set({ theme: saved });
        applyThemeToDOM(saved);
        return saved;
      }
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      let initialTheme = 'dark';
      if (prefersLight && !prefersDark) {
        initialTheme = 'light';
      }
      set({ theme: initialTheme });
      applyThemeToDOM(initialTheme);
      return initialTheme;
    } catch {
      set({ theme: 'dark' });
      applyThemeToDOM('dark');
      return 'dark';
    }
  },

  setTheme: (theme) => {
    const validTheme = theme === 'light' ? 'light' : 'dark';
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('beingus-theme', validTheme);
      }
    } catch {}
    set({ theme: validTheme });
    applyThemeToDOM(validTheme);
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

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

