import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateRoomModal } from './CreateRoomModal';

describe('CreateRoomModal Component', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(<CreateRoomModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('prompts sign in when user is not authenticated', () => {
    render(<CreateRoomModal isOpen={true} user={null} onClose={vi.fn()} />);
    expect(screen.getByText('Sign in to host')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('allows authenticated user to choose mood, enter name, and create room', async () => {
    const onCreateRoom = vi.fn().mockResolvedValue(undefined);
    const user = {
      id: 'u-host-1',
      user_metadata: { full_name: 'Sai Sumanth', avatar_url: 'avatar.png' }
    };

    render(
      <CreateRoomModal 
        isOpen={true} 
        user={user} 
        onClose={vi.fn()} 
        onCreateRoom={onCreateRoom} 
      />
    );

    expect(screen.getByText('Create Room')).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText("Sai's Watch Party");
    fireEvent.change(nameInput, { target: { value: 'Movie Night Extravaganza' } });

    // Select Cinema mood
    const cinemaRadio = screen.getByDisplayValue('cinema');
    fireEvent.click(cinemaRadio);

    const submitBtn = screen.getByText('Start Room');
    fireEvent.click(submitBtn);

    expect(onCreateRoom).toHaveBeenCalledWith('u-host-1', 'Sai Sumanth', 'avatar.png', 'Movie Night Extravaganza', 'cinema');
  });
});
