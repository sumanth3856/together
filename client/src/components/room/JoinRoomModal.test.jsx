import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinRoomModal } from './JoinRoomModal';

describe('JoinRoomModal Component', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(<JoinRoomModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('prompts sign in when user is unauthenticated', () => {
    render(<JoinRoomModal isOpen={true} user={null} onClose={vi.fn()} />);
    expect(screen.getByText('Sign in to join')).toBeInTheDocument();
  });

  it('allows authenticated user to enter 6-digit code and submit', () => {
    const onJoinRoom = vi.fn().mockResolvedValue(undefined);
    const user = {
      id: 'u-guest-1',
      user_metadata: { full_name: 'Bob', avatar_url: 'bob.png' }
    };

    render(
      <JoinRoomModal 
        isOpen={true} 
        user={user} 
        onClose={vi.fn()} 
        onJoinRoom={onJoinRoom} 
      />
    );

    const inputs = screen.getAllByPlaceholderText('0');
    expect(inputs.length).toBe(6);

    // Enter digits 1, 2, 3, 4, 5, 6
    ['1', '2', '3', '4', '5', '6'].forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } });
    });

    const joinBtn = screen.getByRole('button', { name: /join room/i });
    expect(joinBtn).not.toBeDisabled();
    fireEvent.click(joinBtn);

    expect(onJoinRoom).toHaveBeenCalledWith('123456', 'u-guest-1', 'Bob', 'bob.png');
  });
});
