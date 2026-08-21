import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfileModal } from './UserProfileModal';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store/useUIStore';

describe('UserProfileModal Component', () => {
  const user = {
    email: 'sai@example.com',
    user_metadata: { full_name: 'Sai Sumanth' },
  };

  it('returns null when isOpen is false', () => {
    const { container } = render(<UserProfileModal isOpen={false} user={user} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders user details and allows updating display name', async () => {
    const updateSpy = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({ error: null });
    const setToast = vi.fn();
    useUIStore.setState({ setToastNotification: setToast });
    const onClose = vi.fn();

    render(<UserProfileModal isOpen={true} user={user} onClose={onClose} />);

    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sai@example.com')).toBeInTheDocument();

    const nameInput = screen.getByDisplayValue('Sai Sumanth');
    fireEvent.change(nameInput, { target: { value: 'Sai Sumanth Updated' } });

    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    expect(updateSpy).toHaveBeenCalledWith({
      data: { full_name: 'Sai Sumanth Updated' }
    });
  });

  it('opens confirmation modal when clicking Sign Out', () => {
    render(<UserProfileModal isOpen={true} user={user} onClose={vi.fn()} />);

    const signOutBtn = screen.getByText('Sign Out');
    fireEvent.click(signOutBtn);

    expect(screen.getByText('Are you sure you want to sign out? You will be disconnected from any active rooms.')).toBeInTheDocument();
  });
});
