import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSocket } from './useSocket';
import { renderHook, act } from '@testing-library/react';

const mockEmit = vi.fn();
const mockOn = vi.fn();

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    emit: mockEmit,
    on: mockOn,
    id: 'mock-socket-id'
  }))
}));

describe('useSocket', () => {
  beforeEach(() => {
    mockEmit.mockClear();
    mockOn.mockClear();
    localStorage.clear();
  });

  it('connects to socket and returns functions', () => {
    const { result } = renderHook(() => useSocket());
    
    expect(typeof result.current.createRoom).toBe('function');
    expect(typeof result.current.joinRoom).toBe('function');
    expect(typeof result.current.leaveRoom).toBe('function');
    
    act(() => {
      result.current.sendChatMessage('hello');
    });
    
    expect(mockEmit).toHaveBeenCalledWith('send_chat', { text: 'hello' });
  });

  it('addToQueue emits correct event', () => {
    const { result } = renderHook(() => useSocket());
    act(() => result.current.addToQueue({ videoId: '123' }));
    expect(mockEmit).toHaveBeenCalledWith('add_to_queue', { videoId: '123' });
  });

  it('syncPlayback emits correct event', () => {
    const { result } = renderHook(() => useSocket());
    act(() => result.current.syncPlayback({ currentTime: 10 }));
    expect(mockEmit).toHaveBeenCalledWith('sync_playback', { currentTime: 10 });
  });
});
