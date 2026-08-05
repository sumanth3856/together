import React, { memo, useState } from 'react';

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
  locked = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-4 p-4 md:px-6 bg-surface-container rounded-3xl border border-outline-variant w-full flex flex-col gap-3 shadow-md ambient-shadow">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        
        {/* Left: spacer to keep the play button centered */}
        <div className="flex-1" aria-hidden="true" />

        {/* Center: Play/Pause */}
        <div className="flex items-center justify-center">
          <button
            onClick={onManualPlayPause}
            disabled={locked}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${locked ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-60' : 'bg-primary text-on-primary hover:bg-surface-tint hover:shadow-lg hover:-translate-y-0.5'}`}
            title={locked ? 'Controls locked by host' : (localPlaying ? 'Pause (Space)' : 'Play (Space)')}
          >
            {localPlaying ? <span className="material-symbols-outlined fill-1 text-[24px]">pause</span> : <span className="material-symbols-outlined fill-1 text-[24px]">play_arrow</span>}
          </button>
        </div>

        {/* Right: Volume */}
        <div className="flex items-center justify-end gap-2 flex-1">
          <button
            onClick={onMuteToggle}
            className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-background"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {isMuted || volume === 0
              ? <span className="material-symbols-outlined text-[20px] text-error">volume_off</span>
              : <span className="material-symbols-outlined text-[20px]">volume_up</span>}
          </button>
          <input
            type="range" min={0} max={100}
            value={isMuted ? 0 : volume}
            onChange={onVolumeChange}
            className="w-20 h-1.5 bg-outline-variant rounded-full appearance-none outline-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-label-sm text-on-surface-variant w-10 text-right tabular-nums">
          {formatTime(isDragging ? dragValue : currentTime)}
        </span>
        <div 
          className="relative flex-1 h-2 bg-outline-variant rounded-full cursor-pointer flex items-center group transition-all"
        >
          <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100 ease-linear pointer-events-none" 
            style={{ width: `${isDragging ? (dragValue / (duration || 1)) * 100 : progressPercent}%` }} 
          />
          {/* Custom Thumb */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 md:w-4 md:h-4 bg-primary rounded-full shadow border-2 border-surface-container-lowest opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none" 
            style={{ left: `${isDragging ? (dragValue / (duration || 1)) * 100 : progressPercent}%` }} 
          />
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={isDragging ? dragValue : (currentTime || 0)}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setDragValue(val);
            }}
            onMouseUp={(e) => {
              setIsDragging(false);
              onSeekChange(e);
            }}
            onTouchEnd={(e) => {
              setIsDragging(false);
              onSeekChange(e);
            }}
            disabled={locked}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
        </div>
        <span className="text-xs font-label-sm text-on-surface-variant w-10 tabular-nums">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
});
