import React, { useState } from 'react';
import { Tv, Users, Copy, Check, LogOut, Crown, Share2 } from 'lucide-react';

export function RoomHeader({ roomId, memberCount, isHost, onLeaveRoom }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <header 
      className="panel" 
      style={{
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}
    >
      {/* Brand Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div 
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Tv size={18} color="#ffffff" />
        </div>
        <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff' }}>
          Together
        </span>
      </div>

      {/* Room Badges & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Room Code Button */}
        <button 
          onClick={handleCopyCode}
          className="badge badge-room"
          title="Click to copy Room Code"
          style={{ 
            padding: '5px 12px', 
            fontSize: '0.8rem', 
            cursor: 'pointer',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            transition: 'border-color var(--transition-fast)'
          }}
        >
          {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          <span>{roomId}</span>
          {copiedCode && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>Copied</span>}
        </button>

        {/* Share Invite Link Button */}
        <button
          onClick={handleCopyShareLink}
          className="btn btn-secondary"
          style={{ minHeight: '30px', padding: '0 10px', fontSize: '0.78rem' }}
          title="Copy direct invite link to share with friends"
        >
          {copiedLink ? <Check size={13} color="#10b981" /> : <Share2 size={13} />}
          <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
        </button>

        {/* Member Counter */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-input)',
            padding: '5px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-success)' }} />
          <Users size={13} />
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{memberCount}</span>
        </div>

        {/* Host Badge */}
        {isHost && (
          <span className="badge badge-host">
            <Crown size={13} /> Host
          </span>
        )}
      </div>

      {/* Leave Room Button */}
      <button 
        onClick={onLeaveRoom}
        className="btn btn-ghost"
        style={{ minHeight: '34px', padding: '0 10px', fontSize: '0.8rem', color: '#ef4444' }}
        title="Leave room"
      >
        <LogOut size={15} />
        <span>Leave</span>
      </button>
    </header>
  );
}
