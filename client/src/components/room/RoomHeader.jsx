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

  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.image || null;
  const initial = user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');
  const theme = useUIStore(state => state.theme);
  const toggleTheme = useUIStore(state => state.toggleTheme);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-outline-variant/60 h-16 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between md:justify-items-stretch gap-2 sm:gap-4 px-4 md:px-8">
        
        {/* Left: Brand */}
        <a href="/" aria-label="Being Us – home"
          className="flex items-center gap-2 justify-self-start min-w-0 group">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary text-xl fill-1 shrink-0">play_circle</span>
            </div>
            <span className="font-display-lg text-lg sm:text-xl font-bold tracking-tight text-on-background truncate">Being Us</span>
        </a>

        {/* Center: Room Code */}
        {roomId && (
          <div className="flex items-center md:justify-self-center min-w-0 mx-1 sm:mx-4">
              <button 
                onClick={handleCopyCode}
                title="Click to copy room code"
                aria-label={`Copy room code ${roomId}`}
                className="bg-surface-container-highest/80 hover:bg-surface-container-highest transition-all px-3 sm:px-4 py-1.5 rounded-full border border-outline-variant/80 hover:border-primary/50 flex items-center gap-2 group active:scale-95 shadow-soft"
              >
                  <span className="hidden sm:inline text-xs font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Room</span>
                  <span className="font-display-lg font-bold text-primary text-xs sm:text-base md:text-lg tracking-wider sm:tracking-widest whitespace-nowrap select-all">{roomId}</span>
                  <span className="material-symbols-outlined text-[15px] sm:text-[17px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">content_copy</span>
              </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 justify-self-end shrink-0 min-w-0">
            {/* Global Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-highest text-on-surface hover:text-primary flex items-center justify-center transition-all border border-outline-variant/80 shadow-soft active:scale-95"
            >
              <span className="material-symbols-outlined text-[19px] sm:text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {user && (
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                title={`Profile: ${user.user_metadata?.full_name || user.email || 'User'}`}
                aria-label="Open User Profile"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-highest text-primary flex items-center justify-center font-bold hover:ring-2 hover:ring-primary/40 transition-all border border-outline-variant/80 shadow-soft text-sm active:scale-95 overflow-hidden"
              >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={user.user_metadata?.full_name || 'Profile'}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <span style={{ display: userAvatar ? 'none' : 'flex' }}>
                    {initial}
                  </span>
              </button>
            )}
            
            <button 
              onClick={() => setShowLeaveConfirm(true)}
              title={isHost ? "Disband and leave room" : "Leave room"}
              aria-label={isHost ? "Disband and leave room" : "Leave room"}
              className="btn btn-secondary px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-error hover:text-on-error hover:border-error border-outline-variant/80 rounded-full text-xs sm:text-sm font-semibold shadow-soft"
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
