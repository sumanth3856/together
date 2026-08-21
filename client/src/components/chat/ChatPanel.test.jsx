import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatPanel } from './ChatPanel';
import { useRoomStore } from '../../store/useRoomStore';

const mockSendChatMessage = vi.fn();
const mockSendReaction = vi.fn();

vi.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    sendChatMessage: mockSendChatMessage,
    sendReaction: mockSendReaction,
  }),
}));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }) => ({
    getTotalSize: () => count * 60,
    getVirtualItems: () => Array.from({ length: count }, (_, i) => ({
      index: i,
      key: i,
      start: i * 60,
      size: 60,
    })),
    measureElement: () => {},
    scrollToIndex: () => {},
  }),
}));

describe('ChatPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRoomStore.setState({
      socketId: 'sock-1',
      roomState: {
        roomId: '123456',
        members: [{ userId: 'u1', socketIds: ['sock-1'], nickname: 'Sai' }],
        chatHistory: [
          { id: '1', senderId: 'u2', sender: 'Friend', text: 'Hello together!', isSystem: false, timestamp: Date.now() - 5000 },
          { id: '2', senderId: 'u1', sender: 'Sai', text: 'Hey there!', isSystem: false, timestamp: Date.now() },
          { id: '3', text: 'Friend joined the room.', isSystem: true, timestamp: Date.now() },
        ],
      },
    });
  });

  it('renders chat header, reaction bar, and messages', () => {
    render(<ChatPanel />);
    expect(screen.getByText('Moments')).toBeInTheDocument();
    expect(screen.getByText('Hello together!')).toBeInTheDocument();
    expect(screen.getByText('Hey there!')).toBeInTheDocument();
    expect(screen.getByText('Friend joined the room.')).toBeInTheDocument();
  });

  it('submits a chat message on form submission', () => {
    render(<ChatPanel />);
    const input = screen.getByPlaceholderText('Share a moment…');
    const sendBtn = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Excited for the movie!' } });
    fireEvent.click(sendBtn);

    expect(mockSendChatMessage).toHaveBeenCalledWith('Excited for the movie!');
    expect(input.value).toBe('');
  });

  it('renders empty state when no messages exist', () => {
    useRoomStore.setState({
      roomState: {
        roomId: '123456',
        members: [],
        chatHistory: [],
      },
    });

    render(<ChatPanel />);
    expect(screen.getByText('No moments yet.')).toBeInTheDocument();
  });
});
