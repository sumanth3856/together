import React, { memo, useState } from 'react';

export const formatTime = (secs) => {
  if (isNaN(secs) || secs === null || secs === undefined || secs <= 0) return '0:00';
  const totalSecs = Math.floor(secs);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const paddedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  if (hours > 0) {
    const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
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

  const effectiveDuration = duration && duration > 0 ? duration : 0;
  const displayTime = isDragging ? dragValue : (currentTime || 0);
  const progressPercent = effectiveDuration > 0 ? (displayTime / effectiveDuration) * 100 : 0;

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setDragValue(val);
      if (onSeekChange) onSeekChange(val);
    }
  };

  const handleSliderCommit = (e) => {
    setIsDragging(false);
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && onSeekChange) {
      onSeekChange(val);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-surface-container rounded-2xl border border-outline-variant w-full flex flex-col gap-2.5 shadow-sm ambient-shadow">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Duration indicator */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-label-sm text-on-surface-variant font-medium tabular-nums">
            {formatTime(displayTime)}
          </span>
          <span className="text-xs text-on-surface-variant/50">/</span>
          <span className="text-xs font-label-sm text-on-surface-variant/70 tabular-nums">
            {formatTime(effectiveDuration)}
          </span>
        </div>

        {/* Center: Play/Pause Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={onManualPlayPause}
            disabled={locked}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${locked ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-60' : 'bg-primary text-on-primary hover:bg-surface-tint hover:shadow-lg'}`}
            title={locked ? 'Controls locked by host' : (localPlaying ? 'Pause (Space)' : 'Play (Space)')}
            aria-label={localPlaying ? 'Pause' : 'Play'}
          >
            {localPlaying ? (
              <span className="material-symbols-outlined fill-1 text-[22px]">pause</span>
            ) : (
              <span className="material-symbols-outlined fill-1 text-[22px] translate-x-0.5">play_arrow</span>
            )}
          </button>
        </div>

        {/* Right: Volume & Mute */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onMuteToggle}
            className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-background"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <span className="material-symbols-outlined text-[20px] text-error">volume_off</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">volume_up</span>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={onVolumeChange}
            aria-label="Volume slider"
            className="w-16 sm:w-20 h-1.5 bg-outline-variant rounded-full appearance-none outline-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Progress Scrubber */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 h-2 bg-outline-variant/60 rounded-full cursor-pointer flex items-center group transition-all">
          <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-75 ease-linear pointer-events-none" 
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} 
          />
          {/* Custom Playhead Thumb */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md border border-surface-container-lowest group-hover:scale-125 transition-transform duration-100 pointer-events-none" 
            style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }} 
          />
          <input
            type="range"
            min="0"
            max={effectiveDuration > 0 ? effectiveDuration : 100}
            step="any"
            value={displayTime}
            onMouseDown={() => {
              setIsDragging(true);
              setDragValue(currentTime || 0);
            }}
            onTouchStart={() => {
              setIsDragging(true);
              setDragValue(currentTime || 0);
            }}
            onPointerDown={() => {
              setIsDragging(true);
              setDragValue(currentTime || 0);
            }}
            onChange={handleSliderChange}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            onPointerUp={handleSliderCommit}
            disabled={locked}
            aria-label="Seek time scrubber"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
        </div>
      </div>
    </div>
  );
});

