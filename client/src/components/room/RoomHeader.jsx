import React, { useState } from 'react';
import { Monitor, LogOut, Copy, User, Settings } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useRoomStore } from '../../store/useRoomStore';
import { useSocket } from '../../hooks/useSocket';
import { UserProfileModal } from '../profile/UserProfileModal';

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
    <header className="room-header" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
      {/* Brand */}
      <div className="room-header-brand" style={{ justifySelf: 'start' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'var(--accent-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
          flexShrink: 0
        }}>
          <Monitor size={16} color="#fff" />
        </div>
        <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: "var(--font-outfit), sans-serif", letterSpacing: '-0.02em' }}>
          Together
        </span>
      </div>

      {/* Center: Room Code */}
      <div style={{ justifySelf: 'center', display: 'flex', alignItems: 'center' }}>
        {roomId && (
          <button
            onClick={handleCopyCode}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--accent-primary-dim)', border: '1px solid rgba(1,69,242,0.15)',
              borderRadius: 'var(--radius-full)', padding: '4px 12px',
              cursor: 'pointer', color: 'var(--accent-primary)',
              fontSize: '0.8rem', fontWeight: '700', fontFamily: "var(--font-outfit), monospace",
              letterSpacing: '0.06em', transition: 'all var(--transition-fast)',
            }}
            title="Click to copy room code"
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(1,69,242,0.15)'; e.currentTarget.style.borderColor = 'rgba(1,69,242,0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--accent-primary-dim)'; e.currentTarget.style.borderColor = 'rgba(1,69,242,0.15)'; }}
          >
            {roomId}
            <Copy size={13} />
          </button>
        )}
      </div>

      {/* Profile & Settings & Leave */}
      <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isHost && (
          <button
            onClick={() => updateRoomSettings({ allowMemberControls: !roomState?.settings?.allowMemberControls })}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: roomState?.settings?.allowMemberControls ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${roomState?.settings?.allowMemberControls ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
              color: roomState?.settings?.allowMemberControls ? 'var(--status-success)' : 'var(--status-danger)'
            }}
            title={roomState?.settings?.allowMemberControls ? "Member Controls: Enabled (Click to Disable)" : "Member Controls: Disabled (Click to Enable)"}
          >
            <Settings size={16} />
          </button>
        )}

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
          >
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={16} color="var(--accent-primary)" />
            )}
          </button>
        )}

        <button
          onClick={onLeaveRoom}
          className="btn btn-danger btn-leave"
          style={{ minHeight: '32px', padding: '0 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
          title="Leave room"
        >
          <LogOut size={14} />
          <span className="hide-on-small">Leave</span>
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
