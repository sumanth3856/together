import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from './LandingPage';

// Mock next/dynamic to render components synchronously in tests
vi.mock('next/dynamic', () => ({
  default: (importFn) => {
    return function MockDynamic(props) {
      if (!props.isOpen && props.isOpen !== undefined) return null;
      return (
        <div role="dialog" data-testid="mock-dynamic-modal">
          <h2>Modal Open</h2>
          <button onClick={props.onClose}>Close</button>
        </div>
      );
    };
  },
}));

describe('LandingPage', () => {
  const defaultProps = {
    initialRoomId: null,
    onCreateRoom: vi.fn(),
    onJoinRoom: vi.fn(),
    user: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders landing page main content and default layout', () => {
    render(<LandingPage {...defaultProps} />);

    expect(screen.getAllByText('Being Us.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Distance means nothing/i)).toBeInTheDocument();
    expect(screen.getByText('Start Watching Now')).toBeInTheDocument();
  });

  it('opens modal when initialRoomId is provided', () => {
    render(<LandingPage {...defaultProps} initialRoomId="123456" />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens modal via Start Watching Now button in hero section', () => {
    render(<LandingPage {...defaultProps} />);

    const startBtn = screen.getByText('Start Watching Now');
    fireEvent.click(startBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens modal via Join a Room button in hero section', () => {
    render(<LandingPage {...defaultProps} />);

    const joinBtn = screen.getByText('Join a Room');
    fireEvent.click(joinBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders user profile button with first name when user is provided', () => {
    const user = {
      id: '123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'John Doe',
      },
    };

    render(<LandingPage {...defaultProps} user={user} />);

    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('renders user profile button with email fallback when full_name is missing', () => {
    const user = {
      id: '123',
      email: 'test@example.com',
      user_metadata: {},
    };

    render(<LandingPage {...defaultProps} user={user} />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('handles window scroll event to update header style', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queueMicrotask(cb);
      return 1;
    });
    const { container } = render(<LandingPage {...defaultProps} />);

    const header = container.querySelector('header');
    expect(header).not.toHaveClass('glass-card');

    // Trigger scroll > 20
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
    fireEvent.scroll(window);
    await vi.waitFor(() => expect(header).toHaveClass('glass-card'));

    // Trigger scroll <= 20
    Object.defineProperty(window, 'scrollY', { value: 10, writable: true, configurable: true });
    fireEvent.scroll(window);
    await vi.waitFor(() => expect(header).not.toHaveClass('glass-card'));
  });

  it('cleans up scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<LandingPage {...defaultProps} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
