import React, { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useSocket } from '../../hooks/useSocket';
import { UserProfileModal } from '../profile/UserProfileModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

export function RoomHeader({ onLeaveRoom, roomId, user }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const setToastNotification = useUIStore(state => state.setToastNotification);
  const roomState = useRoomStore(state => state.roomState);

  const isHost = roomState?.hostId === user?.id;

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setToastNotification({ type: 'success', message: 'Room code copied to clipboard' });
  };

  const initial = user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-outline-variant h-16 flex items-center justify-between px-4 md:px-8">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="material-symbols-outlined text-primary text-2xl fill-1 shrink-0">play_circle</span>
            <span className="font-display-lg text-xl font-bold tracking-tight text-on-background truncate">Being Us</span>
        </div>

        {/* Center: Room Code */}
        {roomId && (
          <div className="flex items-center shrink-0 mx-1 sm:mx-4">
              <button 
                onClick={handleCopyCode}
                title="Click to copy room code"
                className="bg-surface-container hover:bg-surface-container-high transition-colors px-2 sm:px-4 py-1.5 rounded-full border border-outline-variant flex items-center gap-1.5 sm:gap-2 group max-w-[45vw]"
              >
                  <span className="hidden sm:inline font-label-sm text-on-surface-variant uppercase tracking-widest">Room</span>
                  <span className="font-display-lg font-bold text-primary tracking-widest truncate text-base sm:text-xl">{roomId}</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">content_copy</span>
              </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            {user && (
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                aria-label="Open User Profile"
                className="w-10 h-10 rounded-full bg-error-container text-primary flex items-center justify-center font-label-lg hover:bg-primary-container hover:text-on-primary transition-colors border border-outline-variant"
              >
                  {initial}
              </button>
            )}
            
            <button 
              onClick={() => setShowLeaveConfirm(true)}
              aria-label="Leave Room"
              className="bg-surface-container text-on-surface px-4 py-2 rounded-full font-label-lg hover:bg-error hover:text-on-error transition-all border border-outline-variant flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span className="hidden sm:inline">Leave</span>
            </button>
        </div>
      </header>

      {isProfileModalOpen && (
        <UserProfileModal 
          isOpen={isProfileModalOpen}
          user={user} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}

      {showLeaveConfirm && (
        <ConfirmationModal
          title={isHost ? "Disband Room" : "Leave Room"}
          message={isHost ? "As the host, leaving will disband the room for everyone. Are you sure?" : "Are you sure you want to leave this room?"}
          confirmText="Leave"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => {
            setShowLeaveConfirm(false);
            onLeaveRoom();
          }}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
    </>
  );
}
