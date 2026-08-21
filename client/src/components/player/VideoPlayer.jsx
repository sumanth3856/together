import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { useRoomStore } from '../../store/useRoomStore';
import { PlaybackControls } from './PlaybackControls';

// Custom lightweight debounce/throttle utility
function throttle(func, limit) {
  let inThrottle;
  let lastArgs;
  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

export function VideoPlayer({
  videoUrl,
  onPlaybackChange,
  onVideoEnded,
}) {
  const playerRef = useRef(null);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('together_volume');
      return saved !== null ? parseInt(saved, 10) : 100;
    }
    return 100;
  });
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('together_isMuted');
      return saved === 'true';
    }
    return false;
  });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Echo-blocking and programmatic sync refs
  const isSelfSyncing = useRef(0);
  const isRemoteSyncingRef = useRef(false);
  const lastProcessedEventRef = useRef(null);
  const currentTimeRef = useRef(0);

  // Keep latest callbacks in refs
  const onPlaybackChangeRef = useRef(onPlaybackChange);
  useEffect(() => {
    onPlaybackChangeRef.current = onPlaybackChange;
  }, [onPlaybackChange]);

  const onVideoEndedRef = useRef(onVideoEnded);
  useEffect(() => {
    onVideoEndedRef.current = onVideoEnded;
  }, [onVideoEnded]);

  const roomState = useRoomStore((state) => state.roomState);
  const syncedPlaybackEvent = useRoomStore((state) => state.syncedPlaybackEvent);
  const socketId = useRoomStore((state) => state.socketId);

  const playback = roomState?.playback;
  const hostId = roomState?.hostId;
  const allowMemberControls = roomState?.settings?.allowMemberControls ?? true;
  const currentMember = roomState?.members?.find((m) => m.socketIds?.includes(socketId));
  const currentUserId = currentMember?.userId;

  // Unified dispatcher that triggers prop callback
  const dispatchPlaybackChange = useCallback((isPlaying, time, extra = {}) => {
    if (onPlaybackChangeRef.current) {
      onPlaybackChangeRef.current({ isPlaying, currentTime: time, ...extra });
    }
  }, []);

  // Throttled sync emitter for scrubbing/seeking
  const throttledSyncRef = useRef(null);
  useEffect(() => {
    throttledSyncRef.current = throttle((isPlaying, time, extra = {}) => {
      dispatchPlaybackChange(isPlaying, time, extra);
    }, 150);
  }, [dispatchPlaybackChange]);

  // Reset state when video changes
  useEffect(() => {
    setVideoLoadError(false);
    setIsPlayerReady(false);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setDuration(0);
  }, [videoUrl]);

  // ─── Real-Time Event-Driven Playback Synchronization ───
  useEffect(() => {
    if (!syncedPlaybackEvent || !syncedPlaybackEvent.playback) return;

    // Process each unique incoming socket event EXACTLY once
    if (syncedPlaybackEvent === lastProcessedEventRef.current) return;
    lastProcessedEventRef.current = syncedPlaybackEvent;

    // Ignore echoes sent by ourselves
    if (syncedPlaybackEvent.senderId === socketId) return;

    const { isPlaying: remoteIsPlaying, currentTime: remoteTime, updatedAt } = syncedPlaybackEvent.playback;
    const action = syncedPlaybackEvent.action || (remoteIsPlaying ? 'play' : 'pause');
    const player = playerRef.current;
    if (!player) return;

    // Flag programmatic update to avoid bouncing callbacks
    isRemoteSyncingRef.current = true;

    if (action === 'pause' || !remoteIsPlaying) {
      // 1. Immediate Frame-Accurate Pause
      setLocalPlaying(false);
      if (typeof player.seekTo === 'function') {
        player.seekTo(remoteTime, 'seconds');
        currentTimeRef.current = remoteTime;
        setCurrentTime(remoteTime);
      }
    } else if (action === 'seek') {
      // 2. Real-Time Scrubber Seek
      if (typeof player.seekTo === 'function') {
        player.seekTo(remoteTime, 'seconds');
        currentTimeRef.current = remoteTime;
        setCurrentTime(remoteTime);
      }
      setLocalPlaying(remoteIsPlaying);
    } else {
      // 3. Real-Time Direct Play Event (No clock-skew transit calculations)
      const currentLocalTime = typeof player.getCurrentTime === 'function' ? (player.getCurrentTime() || 0) : currentTimeRef.current;
      const drift = Math.abs(currentLocalTime - remoteTime);

      // If local player was paused or drifted, align to the authoritative remote timestamp
      if (drift > 1.5) {
        if (typeof player.seekTo === 'function') {
          player.seekTo(remoteTime, 'seconds');
          currentTimeRef.current = remoteTime;
          setCurrentTime(remoteTime);
        }
      }
      setLocalPlaying(true);
    }

    const timer = setTimeout(() => {
      isRemoteSyncingRef.current = false;
    }, 600);

    return () => clearTimeout(timer);
  }, [syncedPlaybackEvent, socketId]);

  const handleDuration = (dur) => {
    if (dur && dur > 0) {
      setDuration(dur);
    }
  };

  const handleReady = () => {
    setIsPlayerReady(true);
    if (playback) {
      const { isPlaying: remoteIsPlaying, currentTime: remoteTime } = playback;
      if (remoteTime > 0 && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        isRemoteSyncingRef.current = true;
        playerRef.current.seekTo(remoteTime, 'seconds');
        currentTimeRef.current = remoteTime;
        setCurrentTime(remoteTime);
        setTimeout(() => {
          isRemoteSyncingRef.current = false;
        }, 600);
      }
      setLocalPlaying(remoteIsPlaying);
    }
  };

  const handleProgress = (state) => {
    if (state?.playedSeconds !== undefined) {
      currentTimeRef.current = state.playedSeconds;
      setCurrentTime(state.playedSeconds);
    }
    if (state?.loadedSeconds && (!duration || duration <= 0)) {
      const dur = playerRef.current && typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() : 0;
      if (dur > 0) setDuration(dur);
    }
  };

  const handlePlay = () => {
    if (!hasInteracted) setHasInteracted(true);
    if (!localPlaying && !isRemoteSyncingRef.current) {
      setLocalPlaying(true);
      const time = playerRef.current && typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : currentTime;
      dispatchPlaybackChange(true, time, { action: 'play' });
    }
  };

  const handlePause = () => {
    if (!hasInteracted) setHasInteracted(true);
    if (localPlaying && !isRemoteSyncingRef.current) {
      setLocalPlaying(false);
      const time = playerRef.current && typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : currentTime;
      dispatchPlaybackChange(false, time, { action: 'pause' });
    }
  };

  const handleEnded = () => {
    setLocalPlaying(false);
    if (onVideoEndedRef.current) onVideoEndedRef.current();
  };

  const handleError = (e) => {
    const errMsg = (e?.message || e?.toString() || '').toLowerCase();
    if (
      e?.name === 'NotAllowedError' ||
      e?.name === 'AbortError' ||
      errMsg.includes('play() failed') ||
      errMsg.includes('notallowed') ||
      errMsg.includes('interrupted')
    ) {
      setLocalPlaying(false);
      return;
    }
    setVideoLoadError(true);
  };

  const handleManualPlayPause = () => {
    if (!hasInteracted) setHasInteracted(true);
    const newIsPlaying = !localPlaying;
    setLocalPlaying(newIsPlaying);
    const time = playerRef.current && typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : currentTime;
    dispatchPlaybackChange(newIsPlaying, time, { action: newIsPlaying ? 'play' : 'pause' });
  };

  const handleSeekChange = (timeOrEvent) => {
    if (!hasInteracted) setHasInteracted(true);
    const newTime = typeof timeOrEvent === 'number'
      ? timeOrEvent
      : parseFloat(timeOrEvent?.target?.value ?? timeOrEvent);

    if (isNaN(newTime) || newTime < 0) return;

    setCurrentTime(newTime);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      isSelfSyncing.current = Date.now();
      playerRef.current.seekTo(newTime, 'seconds');
      if (throttledSyncRef.current) {
        throttledSyncRef.current(localPlaying, newTime, { action: 'seek' });
      } else {
        dispatchPlaybackChange(localPlaying, newTime, { action: 'seek' });
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (typeof window !== 'undefined') localStorage.setItem('together_volume', newVol.toString());
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      if (typeof window !== 'undefined') localStorage.setItem('together_isMuted', 'false');
    }
  };

  const handleMuteToggle = () => {
    if (!hasInteracted) setHasInteracted(true);
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (typeof window !== 'undefined') localStorage.setItem('together_isMuted', nextMuted.toString());
  };

  const canControl = currentUserId === hostId || allowMemberControls;

  // Format 11-char YouTube ID to full URL
  const fullUrl = videoUrl?.length === 11 ? `https://www.youtube.com/watch?v=${videoUrl}` : videoUrl;

  return (
    <div className="w-full flex flex-col gap-3" data-testid="video-player-container">
      {/* Screen Frame Container */}
      <div className="relative group w-full aspect-video bg-neutral-950 rounded-3xl overflow-hidden shadow-elevation-3 flex items-center justify-center border border-outline-variant/40">
        {/* Cover for un-authorized members to block native player clicks */}
        {!canControl && (
          <div className="absolute inset-0 z-10 cursor-not-allowed" aria-label="Controls restricted to host" />
        )}

        {videoLoadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-error bg-surface-container" data-testid="video-error-state">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p className="font-label-lg">Failed to load video.</p>
          </div>
        ) : !videoUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container" data-testid="video-empty-state">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-50">smart_display</span>
            <p className="font-title-md">Search or paste a link to start watching</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <ReactPlayer
              ref={playerRef}
              url={fullUrl}
              playing={isPlayerReady ? localPlaying : false}
              volume={volume / 100}
              muted={isMuted || !hasInteracted}
              onReady={handleReady}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onError={handleError}
              width="100%"
              height="100%"
              progressInterval={500}
              config={{
                youtube: {
                  playerVars: {
                    controls: canControl ? 1 : 0,
                    disablekb: !canControl ? 1 : 0,
                    modestbranding: 1,
                    playsinline: 1,
                    enablejsapi: 1,
                    rel: 0,
                    origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                  },
                },
                soundcloud: {
                  options: {
                    show_artwork: true,
                    show_comments: false,
                    show_user: true,
                  },
                },
                file: {
                  attributes: {
                    playsInline: true,
                    controlsList: 'nodownload',
                    crossOrigin: 'anonymous',
                  },
                },
              }}
              style={{ pointerEvents: canControl ? 'auto' : 'none' }}
            />
          </div>
        )}

        {/* Click to Unmute Overlay for Autoplay compliance */}
        {!hasInteracted && videoUrl && localPlaying && (
          <button
            onClick={() => {
              setHasInteracted(true);
              setIsMuted(false);
            }}
            className="absolute top-4 right-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm shadow-lift hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-lg">volume_up</span>
            Click to unmute
          </button>
        )}
      </div>

      {/* Dedicated Playback Controls flush below the media frame */}
      {videoUrl && (
        <PlaybackControls
          localPlaying={localPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted || !hasInteracted}
          onManualPlayPause={handleManualPlayPause}
          onSeekChange={handleSeekChange}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          locked={!canControl}
        />
      )}
    </div>
  );
}
