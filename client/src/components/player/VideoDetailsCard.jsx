import React, { useState } from 'react';
import { Film, Crown, Key, Copy, Check, Share2, Unlock, Radio, Users } from 'lucide-react';

export function VideoDetailsCard({
  currentVideo,
  roomState,
  currentSocketId,
  isHost,
  hasControl,
  onRequestControl
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const controller = roomState?.members?.find((m) => m.hasControl || m.isHost);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState?.roomId || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomState?.roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="panel" style={{ marginTop: '16px', padding: '16px 18px' }}>
      {/* Top Header: Video Title & Youtube ID */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Film size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {currentVideo?.title || 'YouTube Video'}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              ID: {currentVideo?.youtubeId || 'dQw4w9WgXcQ'}
            </span>
          </div>
        </div>

        {/* Sync Drift Indicator Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <Radio size={12} color="var(--status-success)" />
          <span>Live Synced</span>
        </div>
      </div>

      {/* Controller & Room Info Badges */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '10px 12px',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '14px'
        }}
      >
        {/* Playback Controller Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Playback Controller:</span>
          {controller ? (
            <span className={controller.isHost ? 'badge badge-host' : 'badge badge-control'} style={{ padding: '3px 8px' }}>
              {controller.isHost ? <Crown size={11} /> : <Key size={11} />}
              <span>{controller.nickname} {controller.socketId === currentSocketId ? '(You)' : ''}</span>
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>None</span>
          )}
        </div>

        {/* Room Code Badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Room:</span>
          <span className="badge badge-room" style={{ padding: '3px 8px' }}>
            {roomState?.roomId}
          </span>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleCopyCode}
          className="btn btn-secondary"
          style={{ minHeight: '34px', padding: '0 12px', fontSize: '0.78rem', flex: 1 }}
        >
          {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
        </button>

        <button 
          onClick={handleCopyShareLink}
          className="btn btn-secondary"
          style={{ minHeight: '34px', padding: '0 12px', fontSize: '0.78rem', flex: 1 }}
        >
          {copiedLink ? <Check size={13} color="#10b981" /> : <Share2 size={13} />}
          <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
        </button>

        {!isHost && !hasControl && (
          <button 
            onClick={onRequestControl}
            className="btn btn-secondary"
            style={{ minHeight: '34px', padding: '0 12px', fontSize: '0.78rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24', flex: 1 }}
          >
            <Unlock size={13} />
            <span>Request Control</span>
          </button>
        )}
      </div>
    </div>
  );
}
