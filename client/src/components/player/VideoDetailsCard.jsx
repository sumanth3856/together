import React, { useState } from 'react';
import { Film, Crown, Key, Copy, Check, Share2, Unlock, Signal } from 'lucide-react';

export function VideoDetailsCard({ currentVideo, roomState, currentSocketId, isHost, hasControl, onRequestControl }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const controller = roomState?.members?.find((m) => m.hasControl || m.isHost);
  const isPlaying = roomState?.playback?.isPlaying;

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
    <div className="panel" style={{ marginTop: '14px', overflow: 'hidden' }}>
      {/* Video Info Strip */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
        background: 'var(--bg-surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
          {/* Icon */}
          <div style={{
            width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Film size={18} color="var(--accent-primary)" />
          </div>
          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '0.95rem', fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '3px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {currentVideo?.title || 'No Video Loaded'}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ID: {currentVideo?.youtubeId || '—'}
            </span>
          </div>
        </div>

        {/* Live Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
          background: isPlaying ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isPlaying ? 'rgba(16,185,129,0.22)' : 'var(--border-subtle)'}`,
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          fontSize: '0.7rem', fontWeight: '700',
          color: isPlaying ? 'var(--status-success)' : 'var(--text-tertiary)',
          transition: 'all 0.3s ease',
        }}>
          <Signal size={11} />
          <span>{isPlaying ? 'Live' : 'Paused'}</span>
        </div>
      </div>

      {/* Controller & Room Strip */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.15)',
      }}>
        {/* Controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
          {controller?.isHost
            ? <Crown size={13} color="var(--accent-amber)" />
            : <Key size={13} color="var(--accent-emerald)" />}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{controller?.nickname || '—'}</span>
            {controller?.socketId === currentSocketId && <span style={{ color: 'var(--accent-primary)', fontSize: '0.68rem' }}> (you)</span>}
            <span style={{ color: 'var(--text-tertiary)', marginLeft: '4px' }}>is controlling</span>
          </span>
        </div>

        {/* Room Code */}
        <button
          onClick={handleCopyCode}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'var(--accent-primary-dim)', border: '1px solid rgba(99,102,241,0.22)',
            borderRadius: 'var(--radius-full)', padding: '3px 10px',
            cursor: 'pointer', color: '#a5b4fc',
            fontSize: '0.76rem', fontWeight: '700', fontFamily: "'Outfit', monospace",
            letterSpacing: '0.06em', transition: 'all var(--transition-fast)',
          }}
        >
          {copiedCode ? <Check size={11} color="var(--status-success)" /> : <Copy size={11} />}
          <span>{roomState?.roomId}</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{
        padding: '12px 14px',
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))`,
        gap: '8px',
      }}>
        <button onClick={handleCopyShareLink} className="btn btn-secondary" style={{ minHeight: '38px', fontSize: '0.82rem' }}>
          {copiedLink ? <Check size={14} color="var(--status-success)" /> : <Share2 size={14} />}
          <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
        </button>

        {!isHost && !hasControl && (
          <button
            onClick={onRequestControl}
            className="btn btn-secondary"
            style={{
              minHeight: '38px', fontSize: '0.82rem',
              background: 'rgba(245,158,11,0.06)',
              borderColor: 'rgba(245,158,11,0.22)',
              color: 'var(--accent-amber)'
            }}
          >
            <Unlock size={14} />
            <span>Request Control</span>
          </button>
        )}
      </div>
    </div>
  );
}
