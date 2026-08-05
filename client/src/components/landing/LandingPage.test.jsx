import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LandingPage } from './LandingPage';

// Mock child components
vi.mock('../room/JoinRoomModal', () => ({
  JoinRoomModal: ({ initialRoomId, onCreateRoom, onJoinRoom, onCancel }) => (
    <div data-testid="join-room-modal">
      <span data-testid="modal-initial-room-id">{initialRoomId || ''}</span>
      <button data-testid="modal-cancel-btn" onClick={onCancel}>
        Cancel
      </button>
      <button data-testid="modal-join-btn" onClick={() => onJoinRoom && onJoinRoom('test-room')}>
        Join Room
      </button>
    </div>
  ),
}));

vi.mock('../room/CreateRoomModal', () => ({
  CreateRoomModal: ({ onCreateRoom, onClose }) => (
    <div data-testid="create-room-modal">
      <button data-testid="modal-create-btn" onClick={() => onCreateRoom && onCreateRoom()}>
        Create Room
      </button>
      <button data-testid="modal-cancel-btn" onClick={onClose}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

vi.mock('../profile/UserProfileModal', () => ({
  UserProfileModal: ({ user, onClose }) => (
    <div data-testid="user-profile-modal">
      <span data-testid="profile-user-id">{user?.id}</span>
      <button data-testid="profile-close-btn" onClick={onClose}>
        Close Profile
      </button>
    </div>
  ),
}));

vi.mock('../common/UserAvatar', () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}));

describe('LandingPage', () => {
  const defaultProps = {
    initialRoomId: undefined,
    onCreateRoom: vi.fn(),
    onJoinRoom: vi.fn(),
    user: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders landing page main content and default layout', () => {
    render(<LandingPage {...defaultProps} />);

    expect(screen.getAllByText('Being Us.')[0]).toBeInTheDocument();
    expect(screen.getByText('Distance means nothing when you')).toBeInTheDocument();
    expect(screen.getByText('watch together.')).toBeInTheDocument();
    expect(screen.getByText('Designed for Closeness')).toBeInTheDocument();
    expect(screen.getByText('Frame-Perfect Sync')).toBeInTheDocument();
    expect(screen.getByText('Moments in Time')).toBeInTheDocument();
    expect(screen.getByText('Theater Moods')).toBeInTheDocument();
    expect(screen.getByText('Ready to hit play?')).toBeInTheDocument();
    expect(screen.getByText('© 2026 Being Us. All rights reserved.')).toBeInTheDocument();

    // Modals should not be open by default
    expect(screen.queryByTestId('join-room-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-profile-modal')).not.toBeInTheDocument();
  });

  it('opens JoinRoomModal when initialRoomId is provided', async () => {
    render(<LandingPage {...defaultProps} initialRoomId="room-123" />);

    expect(await screen.findByTestId('join-room-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-initial-room-id')).toHaveTextContent('room-123');
  });


  it('opens CreateRoomModal via Start Watching Now button in hero section', async () => {
    render(<LandingPage {...defaultProps} />);

    const createPrivateRoomBtn = screen.getByRole('button', { name: /Start Watching Now/i });
    fireEvent.click(createPrivateRoomBtn);

    expect(await screen.findByTestId('create-room-modal')).toBeInTheDocument();
  });

  it('opens JoinRoomModal via Join a Room button in hero section', async () => {
    render(<LandingPage {...defaultProps} />);

    const joinRoomBtn = screen.getByRole('button', { name: /Join a Room/i });
    fireEvent.click(joinRoomBtn);

    expect(await screen.findByTestId('join-room-modal')).toBeInTheDocument();
  });

  it('opens CreateRoomModal and handles mouse events via Create Your Room button in CTA section', async () => {
    render(<LandingPage {...defaultProps} />);

    const createYourRoomBtn = screen.getAllByRole('button', { name: /Create Your Room/i })[0];

    fireEvent.click(createYourRoomBtn);
    expect(await screen.findByTestId('create-room-modal')).toBeInTheDocument();
  });

  it('renders user profile button with full_name when user is provided', async () => {
    const user = {
      id: 'user-1',
      user_metadata: {
        full_name: 'Alice Cooper',
      },
    };

    render(<LandingPage {...defaultProps} user={user} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();

    const profileBtn = screen.getByText('Alice').closest('button');
    fireEvent.click(profileBtn);

    expect(await screen.findByTestId('user-profile-modal')).toBeInTheDocument();
    expect(screen.getByTestId('profile-user-id')).toHaveTextContent('user-1');

    // Close profile modal
    const closeBtn = screen.getByTestId('profile-close-btn');
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('user-profile-modal')).not.toBeInTheDocument();
  });

  it('renders user profile button with fallback text "Profile" when full_name is missing', () => {
    const user = {
      id: 'user-2',
      user_metadata: {},
    };

    render(<LandingPage {...defaultProps} user={user} />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('handles window scroll event to update header style', () => {
    const { container } = render(<LandingPage {...defaultProps} />);

    const header = container.querySelector('header');
    expect(header).not.toHaveClass('glass-card');

    // Trigger scroll > 20
    window.scrollY = 50;
    fireEvent.scroll(window);
    expect(header).toHaveClass('glass-card');

    // Trigger scroll <= 20
    window.scrollY = 10;
    fireEvent.scroll(window);
    expect(header).not.toHaveClass('glass-card');
  });

  it('cleans up scroll event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<LandingPage {...defaultProps} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
