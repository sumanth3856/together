import React, { useState } from 'react';
import { Heart, LogOut, Copy } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useSocket } from '../../hooks/useSocket';
import { UserProfileModal } from '../profile/UserProfileModal';
import { UserAvatar } from '../common/UserAvatar';

export function RoomHeader({ onLeaveRoom, roomId, user }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const setToastNotification = useUIStore(state => state.setToastNotification);
  const roomState = useRoomStore(state => state.roomState);
  const { updateRoomSettings } = useSocket();

  const isHost = roomState?.hostId === user?.id;

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setToastNotification({ type: 'success', message: 'Room code copied!' });
  };

  return (
    <header className="glass-pill-nav">
      {/* Brand */}
      <div className="glass-pill-nav-brand">
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'var(--accent-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
          flexShrink: 0
        }}>
          <Heart size={16} color="#fff" />
        </div>
        <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: "var(--font-outfit), sans-serif", letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          Being Us
        </span>
      </div>

      {/* Center: Room Code */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {roomId && (
          <button
            onClick={handleCopyCode}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--accent-primary-dim)', border: '1px solid rgba(157, 78, 221, 0.15)',
              borderRadius: 'var(--radius-full)', padding: '4px 12px',
              cursor: 'pointer', color: 'var(--accent-primary)',
              fontSize: '0.8rem', fontWeight: '700', fontFamily: "var(--font-outfit), monospace",
              letterSpacing: '0.06em', transition: 'all var(--transition-fast)',
            }}
            title="Click to copy room code"
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(157, 78, 221, 0.15)'; e.currentTarget.style.borderColor = 'rgba(157, 78, 221, 0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--accent-primary-dim)'; e.currentTarget.style.borderColor = 'rgba(157, 78, 221, 0.15)'; }}
          >
            {roomId}
            <Copy size={13} />
          </button>
        )}
      </div>

      {/* Profile & Settings & Leave */}
      <div className="glass-pill-nav-actions">


        {user && (
          <button
            onClick={() => setIsProfileModalOpen(true)}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent-primary-dim)', border: '1px solid rgba(155, 113, 178, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden', padding: 0
            }}
            title="Profile"
            aria-label="Open User Profile"
          >
            <UserAvatar user={user} size={32} />
          </button>
        )}

        <button
          onClick={onLeaveRoom}
          className="btn btn-danger btn-leave"
          style={{ minHeight: '32px', padding: '0 16px', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
          title="Leave room"
          aria-label="Leave room"
        >
          <LogOut size={16} />
          <span>Exit</span>
        </button>
      </div>

      {isProfileModalOpen && (
        <UserProfileModal 
          user={user} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
    </header>
  );
}
