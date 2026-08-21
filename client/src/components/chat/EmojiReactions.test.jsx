import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmojiReactions } from './EmojiReactions';

describe('EmojiReactions Component', () => {
  it('renders all reaction emoji buttons', () => {
    const onSendReaction = vi.fn();
    render(<EmojiReactions onSendReaction={onSendReaction} />);

    const heartBtn = screen.getByLabelText('React ❤️');
    expect(heartBtn).toBeInTheDocument();
    
    fireEvent.click(heartBtn);
    expect(onSendReaction).toHaveBeenCalledWith('❤️');
  });

  it('renders floating particle when incomingReaction prop changes', () => {
    const { container, rerender } = render(<EmojiReactions onSendReaction={vi.fn()} />);

    rerender(<EmojiReactions incomingReaction={{ emoji: '🔥' }} onSendReaction={vi.fn()} />);
    const particles = container.querySelectorAll('.reaction-particle');
    expect(particles.length).toBe(1);
    expect(particles[0].textContent).toBe('🔥');
  });
});
