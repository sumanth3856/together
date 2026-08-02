import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RoomHeader } from './RoomHeader';

// Mocks
const mockSetToastNotification = vi.fn();
let mockRoomState = null;
const mockUpdateRoomSettings = vi.fn();

vi.mock('../../store/useUIStore', () => ({
  useUIStore: (selector) => selector({ setToastNotification: mockSetToastNotification }),
}));

vi.mock('../../store/useRoomStore', () => ({
  useRoomStore: (selector) => selector({ roomState: mockRoomState }),
}));

vi.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({ updateRoomSettings: mockUpdateRoomSettings }),
}));

vi.mock('../profile/UserProfileModal', () => ({
  UserProfileModal: ({ user, onClose }) => (
    <div data-testid="user-profile-modal">
      <span data-testid="profile-user-id">{user?.id}</span>
      <button data-testid="profile-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('../common/UserAvatar', () => ({
  UserAvatar: ({ user, size }) => (
    <div data-testid="user-avatar" data-size={size}>
      {user?.id}
    </div>
  ),
}));

describe('RoomHeader', () => {
  const mockOnLeaveRoom = vi.fn();
  const defaultProps = {
    onLeaveRoom: mockOnLeaveRoom,
    roomId: null,
    user: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRoomState = { hostId: 'host-user-1' };

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders default brand header and leave button when minimal props are passed', () => {
    // When user is not host
    const nonHostUser = { id: 'guest-1' };
    render(<RoomHeader {...defaultProps} user={nonHostUser} />);

    expect(screen.getByText('Being Us')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /leave room/i })).toBeInTheDocument();

    // Copy room code button, settings button should not be present
    expect(screen.queryByTitle(/click to copy room code/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Toggle Member Controls')).not.toBeInTheDocument();
  });

  it('calls onLeaveRoom when Leave button is clicked', () => {
    render(<RoomHeader {...defaultProps} />);

    const leaveBtn = screen.getByRole('button', { name: /leave room/i });
    fireEvent.click(leaveBtn);

    expect(mockOnLeaveRoom).toHaveBeenCalledTimes(1);
  });

  it('renders room code button and copies code on click', () => {
    const roomId = 'ABC-123';
    render(<RoomHeader {...defaultProps} roomId={roomId} />);

    const codeBtn = screen.getByTitle('Click to copy room code');
    expect(codeBtn).toBeInTheDocument();
    expect(codeBtn).toHaveTextContent('ABC-123');

    // Test mouseOver and mouseOut styling events
    fireEvent.mouseOver(codeBtn);
    expect(codeBtn.style.background).toBe('rgba(157, 78, 221, 0.15)');

    fireEvent.mouseOut(codeBtn);
    expect(codeBtn.style.background).toBe('var(--accent-primary-dim)');

    // Click to copy
    fireEvent.click(codeBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC-123');
    expect(mockSetToastNotification).toHaveBeenCalledWith({
      type: 'success',
      message: 'Room code copied!',
    });
  });


  it('renders user avatar and opens/closes profile modal when user button is clicked', () => {
    const user = { id: 'user-42' };

    render(<RoomHeader {...defaultProps} user={user} />);

    const profileBtn = screen.getByLabelText('Open User Profile');
    expect(profileBtn).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();

    // Modal initially closed
    expect(screen.queryByTestId('user-profile-modal')).not.toBeInTheDocument();

    // Click profile button
    fireEvent.click(profileBtn);
    expect(screen.getByTestId('user-profile-modal')).toBeInTheDocument();
    expect(screen.getByTestId('profile-user-id')).toHaveTextContent('user-42');

    // Close profile modal
    const closeBtn = screen.getByTestId('profile-close-btn');
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('user-profile-modal')).not.toBeInTheDocument();
  });
});
