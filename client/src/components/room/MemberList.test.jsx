import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberList } from './MemberList';
import { useRoomStore } from '../../store/useRoomStore';

const mockKickUser = vi.fn();
const mockTransferHost = vi.fn();

vi.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    kickUser: mockKickUser,
    transferHost: mockTransferHost,
  }),
}));

describe('MemberList Component', () => {
  const members = [
    { userId: 'u1', nickname: 'Sai (Host)', socketIds: ['s1'], avatar: null },
    { userId: 'u2', nickname: 'Alice', socketIds: ['s2'], avatar: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useRoomStore.setState({
      roomState: {
        hostId: 'u1',
        members,
      },
    });
  });

  it('renders all members and online counter', () => {
    render(<MemberList members={members} currentSocketId="s1" />);
    expect(screen.getByText('2 online')).toBeInTheDocument();
    expect(screen.getByText('Sai (Host)')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('allows host to open menu and kick or transfer host', () => {
    render(<MemberList members={members} currentSocketId="s1" />);
    
    const moreBtn = screen.getByText('more_vert');
    fireEvent.click(moreBtn);

    const makeHostBtn = screen.getByText('Make Host');
    expect(makeHostBtn).toBeInTheDocument();
    fireEvent.click(makeHostBtn);
    expect(mockTransferHost).toHaveBeenCalledWith('u2');
  });
});
