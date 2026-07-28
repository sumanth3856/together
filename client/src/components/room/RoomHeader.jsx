import React, { useState } from 'react';
import { Monitor, Users, Copy, Check, LogOut, Crown, Share2, Signal } from 'lucide-react';

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
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      padding: '10px 16px',
      marginBottom: '14px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      flexWrap: 'wrap',
      position: 'sticky',
      top: '8px',
      zIndex: 100,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
          flexShrink: 0
        }}>
          <Monitor size={16} color="#fff" />
        </div>
        <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
          Together
        </span>
      </div>

      {/* Center — Room info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

        {/* Room Code — click to copy */}
        <button
          onClick={handleCopyCode}
          title="Click to copy room code"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px',
            background: 'var(--accent-primary-dim)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            color: '#a5b4fc',
            fontSize: '0.8rem',
            fontWeight: '700',
            fontFamily: "'Outfit', monospace",
            letterSpacing: '0.07em',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-primary-dim)'; }}
        >
          {copiedCode ? <Check size={12} color="var(--status-success)" /> : <Copy size={12} />}
          <span>{roomId}</span>
          {copiedCode && <span style={{ color: 'var(--status-success)', fontSize: '0.68rem', fontFamily: "'Inter', sans-serif", letterSpacing: 0 }}>Copied!</span>}
        </button>

        {/* Share */}
        <button
          onClick={handleCopyShareLink}
          className="btn btn-secondary"
          title="Share invite link"
          style={{ minHeight: '32px', padding: '0 10px', fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
        >
          {copiedLink ? <Check size={12} color="var(--status-success)" /> : <Share2 size={12} />}
          <span className="hide-on-small">{copiedLink ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Live Member Count */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 10px',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.18)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem',
          color: 'var(--status-success)',
          fontWeight: '600'
        }}>
          <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-success)' }} />
          <Users size={12} />
          <span>{memberCount}</span>
        </div>

        {/* Host Badge */}
        {isHost && (
          <span className="badge badge-host" style={{ gap: '4px' }}>
            <Crown size={11} />
            <span>Host</span>
          </span>
        )}
      </div>

      {/* Leave */}
      <button
        onClick={onLeaveRoom}
        className="btn btn-danger"
        style={{ minHeight: '32px', padding: '0 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
        title="Leave room"
      >
        <LogOut size={14} />
        <span className="hide-on-small">Leave</span>
      </button>
    </header>
  );
}
