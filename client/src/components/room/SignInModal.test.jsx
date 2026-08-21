import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInModal } from './SignInModal';
import { supabase } from '../../lib/supabase';

describe('SignInModal Component', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(<SignInModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Google sign in button and triggers OAuth on click', () => {
    const signInSpy = vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({ data: {}, error: null });

    render(<SignInModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    const btn = screen.getByText('Continue with Google');
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(signInSpy).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
  });
});
