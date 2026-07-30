import { describe, it, expect, beforeEach } from 'vitest';
import { useRoomStore } from './useRoomStore';

describe('useRoomStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useRoomStore.setState({
      roomState: null,
      socketId: null,
      isConnected: false,
      isReconnecting: false,
      sessionEnded: false,
      syncedPlaybackEvent: null
    });
  });

  it('initial state is correct', () => {
    const state = useRoomStore.getState();
    expect(state.roomState).toBeNull();
    expect(state.socketId).toBeNull();
    expect(state.isConnected).toBe(false);
  });

  it('setRoomState updates roomState', () => {
    const mockRoom = { roomId: 'TOG-1234', currentVideo: { title: 'Vid' } };
    useRoomStore.getState().setRoomState(mockRoom);
    expect(useRoomStore.getState().roomState).toEqual(mockRoom);
  });

  it('updateChatHistory adds unique messages only', () => {
    const mockRoom = { roomId: 'TOG-1234', chatHistory: [{ id: 'msg-1', text: 'hello' }] };
    useRoomStore.getState().setRoomState(mockRoom);

    // Add unique message
    useRoomStore.getState().updateChatHistory({ id: 'msg-2', text: 'world' });
    expect(useRoomStore.getState().roomState.chatHistory.length).toBe(2);
    expect(useRoomStore.getState().roomState.chatHistory[1].text).toBe('world');

    // Add duplicate message (same id)
    useRoomStore.getState().updateChatHistory({ id: 'msg-1', text: 'duplicate' });
    expect(useRoomStore.getState().roomState.chatHistory.length).toBe(2); // Should not add
  });

  it('updateChatHistory does nothing if roomState is null', () => {
    useRoomStore.getState().setRoomState(null);
    useRoomStore.getState().updateChatHistory({ id: 'msg-1', text: 'hello' });
    expect(useRoomStore.getState().roomState).toBeNull();
  });
});
