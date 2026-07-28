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
    <div className="panel" style={{ marginTop: '16px', padding: '18px 20px' }}>
      {/* Top Header: Video Title & Youtube ID */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
          <div 
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
            }}
          >
            <Film size={22} color="var(--accent-primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 
              style={{ 
                fontSize: '1.1rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                lineHeight: 1.3,
                marginBottom: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.01em'
              }}
            >
              {currentVideo?.title || 'YouTube Video'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace', display: 'block' }}>
              ID: {currentVideo?.youtubeId || 'dQw4w9WgXcQ'}
            </span>
          </div>
        </div>

        {/* Sync Drift Indicator Pill */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            padding: '6px 12px', 
            borderRadius: 'var(--radius-full)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            fontSize: '0.75rem', 
            fontWeight: '600',
            color: '#10b981',
            flexShrink: 0
          }}
        >
          <Radio size={14} color="#10b981" />
          <span className="hide-on-small">Live Synced</span>
        </div>
      </div>

      {/* Controller & Room Info Badges */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 16px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '20px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {/* Playback Controller Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Playback Controller</span>
          {controller ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {controller.isHost ? <Crown size={14} color="var(--accent-secondary)" /> : <Key size={14} color="var(--accent-primary)" />}
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {controller.nickname} {controller.socketId === currentSocketId ? <span style={{ color: 'var(--text-secondary)' }}>(You)</span> : ''}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>None</span>
          )}
        </div>

        {/* Room Code Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Room Code</span>
          <span className="badge badge-room" style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {roomState?.roomId}
          </span>
        </div>
      </div>

      {/* Quick Action Bar (Responsive Grid) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '10px' 
        }}
      >
        <button 
          onClick={handleCopyCode}
          className="btn btn-secondary"
          style={{ minHeight: '40px', padding: '0 12px', fontSize: '0.85rem', width: '100%' }}
        >
          {copiedCode ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
          <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
        </button>

        <button 
          onClick={handleCopyShareLink}
          className="btn btn-secondary"
          style={{ minHeight: '40px', padding: '0 12px', fontSize: '0.85rem', width: '100%' }}
        >
          {copiedLink ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
          <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
        </button>

        {!isHost && !hasControl && (
          <button 
            onClick={onRequestControl}
            className="btn btn-secondary"
            style={{ 
              minHeight: '40px', 
              padding: '0 12px', 
              fontSize: '0.85rem', 
              width: '100%',
              background: 'rgba(245, 158, 11, 0.05)',
              borderColor: 'rgba(245, 158, 11, 0.3)', 
              color: '#fbbf24' 
            }}
          >
            <Unlock size={16} />
            <span>Request Control</span>
          </button>
        )}
      </div>
    </div>
  );
}
