import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ToastStack } from './ToastStack';

const mockRemoveToast = vi.fn();
let mockToasts = [];

vi.mock('../../store/useUIStore', () => ({
  useUIStore: (selector) => selector({ toasts: mockToasts, removeToast: mockRemoveToast }),
}));

describe('ToastStack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToasts = [];
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastStack />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });

  it('renders a success toast with its message', () => {
    mockToasts = [{ id: '1', type: 'success', message: 'Room code copied to clipboard' }];
    render(<ToastStack />);
    expect(screen.getByText('Room code copied to clipboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument();
  });

  it('renders an error toast with an assertive live region', () => {
    mockToasts = [{ id: '1', type: 'error', message: 'Something went wrong' }];
    render(<ToastStack />);
    const toast = screen.getByText('Something went wrong').closest('div');
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  it('falls back to the info variant for unknown toast types', () => {
    mockToasts = [{ id: '1', type: 'unknown', message: 'Generic message' }];
    render(<ToastStack />);
    expect(screen.getByText('Generic message')).toBeInTheDocument();
  });

  it('calls removeToast when the dismiss button is clicked', () => {
    mockToasts = [{ id: 'abc', type: 'warning', message: 'You are typing too fast!' }];
    render(<ToastStack />);
    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(mockRemoveToast).toHaveBeenCalledWith('abc');
  });

  it('applies the toast-out animation class when a toast is leaving', () => {
    mockToasts = [{ id: '1', type: 'info', message: 'Bye', leaving: true }];
    render(<ToastStack />);
    expect(screen.getByText('Bye').closest('div')).toHaveClass('toast-out');
  });
});
