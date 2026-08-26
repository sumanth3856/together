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
  locked = false,
  onToggleFullscreen,
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
      if (!isDragging && onSeekChange) {
        onSeekChange(val);
      }
    }
  };

  const handleSliderCommit = (e) => {
    setIsDragging(false);
    const targetVal = e?.target?.value !== undefined ? parseFloat(e.target.value) : dragValue;
    const finalVal = !isNaN(targetVal) ? targetVal : dragValue;
    if (!isNaN(finalVal) && onSeekChange) {
      onSeekChange(finalVal);
    }
  };

  const handleSkip = (offsetSeconds) => {
    if (locked || !onSeekChange) return;
    const target = Math.max(0, Math.min(effectiveDuration, (currentTime || 0) + offsetSeconds));
    onSeekChange(target);
  };

  const toggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
      return;
    }
    if (!document.fullscreenElement) {
      const container = document.querySelector('[data-testid="video-player-container"]') || document.documentElement;
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div className="p-3.5 sm:p-4 bg-surface-container/90 backdrop-blur-md rounded-2xl border border-outline-variant/60 w-full flex flex-col gap-3 shadow-card">
      
      {/* ── 1. Progress Scrubber Track + Timestamp Pill at End ── */}
      <div className="flex items-center gap-3 sm:gap-4 w-full pt-0.5">
        {/* Scrubber Track */}
        <div className="relative flex-1 h-2 hover:h-2.5 bg-surface-container-highest rounded-full cursor-pointer flex items-center group transition-all">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-75 ease-linear pointer-events-none" 
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} 
          />
          {/* Custom Playhead Thumb */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-glow border border-primary/50 group-hover:scale-125 transition-transform duration-150 pointer-events-none" 
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

        {/* Timestamp Pill at the ending of progress track */}
        <div className="flex items-center justify-center px-2.5 py-0.5 bg-surface-container-lowest/80 rounded-full border border-outline-variant/60 text-xs sm:text-sm font-medium shrink-0 select-none shadow-2xs">
          <span className="text-on-surface font-semibold tabular-nums">
            {formatTime(displayTime)}
          </span>
          <span className="mx-1 text-on-surface-muted">/</span>
          <span className="text-on-surface-variant font-medium tabular-nums">
            {formatTime(effectiveDuration)}
          </span>
        </div>
      </div>

      {/* ── 2. Flexbox Action Controls Row ── */}
      <div className="flex items-center justify-between gap-3 w-full">
        
        {/* Left Action Cluster: Play/Pause, Quick Skip (-10s / +10s), Mute & Volume */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Play/Pause Button */}
          <button
            onClick={onManualPlayPause}
            disabled={locked}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${locked ? 'bg-surface-container-highest text-on-surface-muted cursor-not-allowed opacity-60' : 'bg-primary text-on-primary hover:bg-primary-hover hover:shadow-glow'}`}
            title={locked ? 'Controls locked by host' : (localPlaying ? 'Pause (Space)' : 'Play (Space)')}
            aria-label={localPlaying ? 'Pause' : 'Play'}
          >
            {localPlaying ? (
              <span className="material-symbols-outlined fill-1 text-[20px]">pause</span>
            ) : (
              <span className="material-symbols-outlined fill-1 text-[20px] translate-x-0.5">play_arrow</span>
            )}
          </button>

          {/* Quick Rewind -10s */}
          <button
            onClick={() => handleSkip(-10)}
            disabled={locked}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hidden sm:inline-flex active:scale-95"
            title="Rewind 10s"
            aria-label="Rewind 10 seconds"
          >
            <span className="material-symbols-outlined text-[20px]">replay_10</span>
          </button>

          {/* Quick Forward +10s */}
          <button
            onClick={() => handleSkip(10)}
            disabled={locked}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hidden sm:inline-flex active:scale-95"
            title="Forward 10s"
            aria-label="Forward 10 seconds"
          >
            <span className="material-symbols-outlined text-[20px]">forward_10</span>
          </button>

          {/* Mute & Volume Slider */}
          <div className="group/volume relative flex items-center gap-1 sm:gap-1.5 ml-1">
            <button
              onClick={onMuteToggle}
              className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface active:scale-95"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <span className="material-symbols-outlined text-[20px] text-error">volume_off</span>
              ) : volume <= 35 ? (
                <span className="material-symbols-outlined text-[20px]">volume_mute</span>
              ) : volume <= 70 ? (
                <span className="material-symbols-outlined text-[20px]">volume_down</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
              )}
            </button>

            {/* Floating Percentage Tooltip on Hover */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface text-[10px] font-bold px-2 py-0.5 rounded-full border border-outline-variant shadow-md pointer-events-none opacity-0 group-hover/volume:opacity-100 group-focus-within/volume:opacity-100 transition-opacity duration-150 whitespace-nowrap z-30">
              {isMuted ? 'Muted' : `${volume}%`}
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={onVolumeChange}
              aria-label="Volume slider"
              style={{
                background: `linear-gradient(to right, #e53935 0%, #e53935 ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.12) ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.12) 100%)`
              }}
              className="w-20 sm:w-28 md:w-32 h-1.5 rounded-full appearance-none outline-none cursor-pointer accent-primary hover:h-2 transition-all"
            />
          </div>
        </div>

        {/* Right Action Cluster: Fullscreen & Lock Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
          {locked && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-xs font-medium border border-outline-variant/60">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Host Controlled
            </span>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface active:scale-95"
            title="Fullscreen"
            aria-label="Toggle fullscreen"
          >
            <span className="material-symbols-outlined text-[20px]">fullscreen</span>
          </button>
        </div>

      </div>
    </div>
  );
});

