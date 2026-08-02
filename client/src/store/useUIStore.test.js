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

    // Fast forward 4 seconds
    vi.advanceTimersByTime(4000);
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
    expect(state.toasts.length).toBe(1);
    expect(state.toasts[0].message).toBe('Toast 2');
  });

  it('should set incoming reaction', () => {
    useUIStore.getState().setIncomingReaction({ emoji: '🔥', userId: 'user1' });
    const state = useUIStore.getState();
    expect(state.incomingReaction).toEqual({ emoji: '🔥', userId: 'user1' });
  });
});
