import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ toasts: [], incomingReaction: null });
    vi.useFakeTimers();
  });

  it('should initialize with empty toasts and null incomingReaction', () => {
    const state = useUIStore.getState();
    expect(state.toasts).toEqual([]);
    expect(state.incomingReaction).toBeNull();
  });

  it('should add a toast notification and auto dismiss it after 4 seconds', () => {
    useUIStore.getState().setToastNotification({ message: 'Hello' });
    let state = useUIStore.getState();
    expect(state.toasts.length).toBe(1);
    expect(state.toasts[0].message).toBe('Hello');

    // Fast forward 4 seconds: toast is marked as leaving so the exit animation plays
    vi.advanceTimersByTime(4000);
    state = useUIStore.getState();
    expect(state.toasts[0].leaving).toBe(true);

    // After the exit animation duration it is fully removed
    vi.advanceTimersByTime(250);
    state = useUIStore.getState();
    expect(state.toasts.length).toBe(0);
  });

  it('should remove a toast notification manually by id', () => {
    useUIStore.getState().setToastNotification({ message: 'Toast 1' });
    useUIStore.getState().setToastNotification({ message: 'Toast 2' });
    let state = useUIStore.getState();
    expect(state.toasts.length).toBe(2);

    const idToRemove = state.toasts[0].id;
    useUIStore.getState().removeToast(idToRemove);

    state = useUIStore.getState();
    expect(state.toasts[0].leaving).toBe(true);
    expect(state.toasts.length).toBe(2);

    vi.advanceTimersByTime(250);
    state = useUIStore.getState();
    expect(state.toasts.length).toBe(1);
    expect(state.toasts[0].message).toBe('Toast 2');
  });

  it('should set incoming reaction', () => {
    useUIStore.getState().setIncomingReaction({ emoji: '🔥', userId: 'user1' });
    const state = useUIStore.getState();
    expect(state.incomingReaction).toEqual({ emoji: '🔥', userId: 'user1' });
  });

  describe('Theme State & Actions', () => {
    beforeEach(() => {
      localStorage.clear();
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.className = '';
    });

    it('should default to dark theme when no storage or matchMedia exists', () => {
      const theme = useUIStore.getState().initTheme();
      expect(theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should restore saved light theme from localStorage', () => {
      localStorage.setItem('beingus-theme', 'light');
      const theme = useUIStore.getState().initTheme();
      expect(theme).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should set theme and persist to localStorage and DOM', () => {
      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
      expect(localStorage.getItem('beingus-theme')).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);

      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
      expect(localStorage.getItem('beingus-theme')).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should toggle theme back and forth correctly', () => {
      useUIStore.getState().setTheme('dark');
      useUIStore.getState().toggleTheme();
      expect(useUIStore.getState().theme).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      useUIStore.getState().toggleTheme();
      expect(useUIStore.getState().theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
