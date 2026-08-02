import React, { memo, useState } from 'react';
import { Film, Copy, Check, Share2, Signal } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';

export const VideoDetailsCard = memo(function VideoDetailsCard({ currentSocketId, onLoadVideo }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const roomId = useRoomStore(state => state.roomState?.roomId);
  const hostId = useRoomStore(state => state.roomState?.hostId);
  const currentVideo = useRoomStore(state => state.roomState?.currentVideo);
  const isPlaying = useRoomStore(state => state.roomState?.playback?.isPlaying);
  const videoQueueLength = useRoomStore(state => state.roomState?.videoQueue?.length || 0);
  const memberCount = useRoomStore(state => state.roomState?.members?.length || 0);

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
    <div className="panel-glass" style={{ marginTop: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
      {/* Video Info Strip */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
        background: 'rgba(30, 30, 30, 0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
          {/* Icon */}
          <div style={{
            width: '42px', height: '42px', borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-primary-dim)', border: '1px solid rgba(155, 113, 178, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px var(--accent-primary-glow)'
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
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Up Next: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{videoQueueLength} video{videoQueueLength !== 1 ? 's' : ''} in queue</span>
            </div>
          </div>
        </div>

        {/* Live Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
          background: isPlaying ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
          border: `1px solid ${isPlaying ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          fontSize: '0.7rem', fontWeight: '700',
          color: isPlaying ? 'var(--status-success)' : 'var(--status-warning)',
          transition: 'all 0.3s ease',
        }}>
          <Signal size={11} />
          <span>{isPlaying ? 'Live' : 'Paused'}</span>
        </div>
      </div>

      {/* Room Badge */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px',
        background: 'var(--bg-surface-3)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '3px 8px',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.18)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.72rem',
          color: 'var(--status-success)',
          fontWeight: '600'
        }}>
          <div className="pulse-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--status-success)' }} />
          <span style={{ fontFamily: "'Inter', sans-serif" }}>{memberCount || 1} Members</span>
        </div>
      </div>

      {/* Quick Actions & URL Input */}
      <div style={{
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const url = e.target.elements.videoUrl.value.trim();
            if (!url) return;
            // Match youtube.com/watch?v= or youtu.be/
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
            if (match && match[1]) {
              if (onLoadVideo) onLoadVideo({ youtubeId: match[1] });
              e.target.reset();
            } else if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
              if (onLoadVideo) onLoadVideo({ youtubeId: url });
              e.target.reset();
            }
          }}
          style={{ display: 'flex', gap: '8px', width: '100%' }}
        >
          <input
            name="videoUrl"
            type="text"
            placeholder="Paste YouTube URL or ID..."
            className="input-field"
            style={{ flex: 1, minHeight: '38px', fontSize: '0.82rem', background: 'var(--bg-input)' }}
          />
          <button type="submit" className="btn btn-primary" style={{ minHeight: '38px', fontSize: '0.82rem', padding: '0 16px', flexShrink: 0 }}>
            Load
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={handleCopyShareLink} className="btn btn-secondary" style={{ minHeight: '38px', fontSize: '0.82rem', padding: '0 24px', flex: 1 }}>
            {copiedLink ? <Check size={14} color="var(--status-success)" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Copied!' : 'Share Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
