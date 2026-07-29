import React, { memo } from 'react';
import { Play, Pause, Signal, Volume2, VolumeX } from 'lucide-react';

// Hoisted: module-level helper — not re-created on every render
const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const PlaybackControls = memo(function PlaybackControls({
  currentTime,
  duration,
  volume,
  isMuted,
  localPlaying,
  onManualPlayPause,
  onSeekChange,
  onVolumeChange,
  onMuteToggle,
}) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      marginTop: '16px',
      padding: '12px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      background: 'var(--bg-surface)',
      borderRadius: '30px',
      boxShadow: 'var(--shadow-md), 0 0 0 1px var(--border-subtle)',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* Left: Sync Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>
            <Signal size={14} color="var(--status-success)" />
            <span className="hide-on-small">Synced</span>
          </div>
        </div>

        {/* Center: Play/Pause */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={onManualPlayPause}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(1,69,242,0.3)', background: 'var(--accent-primary)'
            }}
            title={localPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {localPlaying ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" style={{ marginLeft: '2px' }} />}
          </button>
        </div>

        {/* Right: Volume */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flex: 1 }}>
          <button
            onClick={onMuteToggle}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '50%' }}
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {isMuted || volume === 0
              ? <VolumeX size={18} color="var(--status-danger)" />
              : <Volume2 size={18} color="var(--text-secondary)" />}
          </button>
          <input
            type="range" min={0} max={100}
            value={isMuted ? 0 : volume}
            onChange={onVolumeChange}
            style={{ width: '80px', height: '4px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: '40px', fontWeight: '500' }}>
          {formatTime(currentTime)}
        </span>
        <div className="timeline-slider-container">
          <div className="timeline-slider-track" />
          <div className="timeline-slider-progress" style={{ width: `${progressPercent}%` }} />
          <input
            type="range"
            min={0} max={duration || 100} step={0.5}
            value={currentTime}
            onChange={onSeekChange}
            className="timeline-slider"
          />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: '40px', textAlign: 'right', fontWeight: '500' }}>
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
});
