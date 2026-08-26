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
  const hostId = useRoomStore(state => state.roomState?.hostId);

  const isHost = hostId === user?.id;

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setToastNotification({ type: 'success', message: 'Room code copied to clipboard' });
  };

  const initial = user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-outline-variant h-16 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between md:justify-items-stretch gap-2 sm:gap-4 px-4 md:px-8">
        
        {/* Left: Brand */}
        <a href="/" aria-label="Being Us – home"
          className="flex items-center gap-2 justify-self-start min-w-0">
            <span className="material-symbols-outlined text-primary text-2xl fill-1 shrink-0">play_circle</span>
            <span className="font-display-lg text-xl font-bold tracking-tight text-on-background truncate">Being Us</span>
        </a>

        {/* Center: Room Code */}
        {roomId && (
          <div className="flex items-center md:justify-self-center min-w-0 mx-1 sm:mx-4">
              <button 
                onClick={handleCopyCode}
                title="Click to copy room code"
                className="bg-surface-container hover:bg-surface-container-high transition-colors px-2 sm:px-4 py-1.5 rounded-full border border-outline-variant flex items-center gap-1.5 sm:gap-2 group"
              >
                  <span className="hidden sm:inline font-label-sm text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Room</span>
                  <span className="font-display-lg font-bold text-primary text-xs sm:text-base md:text-xl tracking-wider sm:tracking-widest whitespace-nowrap select-all">{roomId}</span>
                  <span className="material-symbols-outlined text-[15px] sm:text-[17px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">content_copy</span>
              </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 justify-self-end shrink-0 min-w-0">
            {user && (
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                aria-label="Open User Profile"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-label-lg font-bold hover:bg-primary hover:text-on-primary transition-all border border-outline-variant/70 shadow-2xs hover:shadow-soft text-sm"
              >
                  {initial}
              </button>
            )}
            
            <button 
              onClick={() => setShowLeaveConfirm(true)}
              aria-label="Leave Room"
              className="btn btn-secondary px-2.5 sm:px-4 py-1.5 sm:py-2 hover:bg-error hover:text-on-error border-outline-variant/70 rounded-full text-xs sm:text-sm font-semibold shadow-2xs"
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
