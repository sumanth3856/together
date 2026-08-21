import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal Component', () => {
  it('renders title, message, and trigger buttons', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationModal
        title="Leave Room?"
        message="Are you sure you want to leave the party?"
        confirmText="Yes, Leave"
        cancelText="Stay"
        onConfirm={onConfirm}
        onCancel={onCancel}
        variant="danger"
      />
    );

    expect(screen.getByText('Leave Room?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to leave the party?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Yes, Leave'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Stay'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmationModal
        title="Test"
        message="Test message"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
