import React, { useEffect, useRef, useState } from 'react';
import throttle from 'lodash/throttle';
import { PlaybackControls } from './PlaybackControls';
import { Spinner } from '../common/Spinner';
import { useRoomStore } from '../../store/useRoomStore';
import { useSocket } from '../../hooks/useSocket';

export const YouTubePlayer = React.memo(function YouTubePlayer({
  youtubeId,
  onVideoEnded
}) {
  const playback = useRoomStore(state => state.roomState?.playback);
  const allowMemberControls = useRoomStore(state => state.roomState?.settings?.allowMemberControls);
  const hostId = useRoomStore(state => state.roomState?.hostId);
  const currentSocketId = useRoomStore(state => state.socketId);
  const currentUserId = useRoomStore(state => {
    const currentMember = state.roomState?.members?.find(m => m.socketIds?.includes(state.socketId));
    return currentMember?.userId;
  });
  const syncedPlaybackEvent = useRoomStore(state => state.syncedPlaybackEvent);
  const { syncPlayback: onPlaybackChange } = useSocket();
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('together_volume');
      return saved ? parseInt(saved, 10) : 100;
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
  const [syncPromptDismissed, setSyncPromptDismissed] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const isSelfSyncing = useRef(0);
  const hasJoinSyncedRef = useRef(false);
  // Synchronous mirror of the player's actual play/pause state (React state lags)
  const localPlayingRef = useRef(false);
  const playerCreatedRef = useRef(false);
  // Lets the video-change effect rebuild the player if its handle goes stale
  const initPlayerRef = useRef(null);
  // Set when a video change arrives while the player isn't ready yet
  const pendingVideoRef = useRef(null);

  // Use refs to avoid stale closures in YouTube iframe event listeners
  const onPlaybackChangeRef = useRef(onPlaybackChange);
  const onVideoEndedRef = useRef(onVideoEnded);

  // Update ONLY the local room store (no network broadcast) so the sender's
  // badge/state reflects the player even when the echo-blocker suppresses a sync.
  const syncLocalPlaybackState = (isPlaying, currentTime) => {
    const currentState = useRoomStore.getState().roomState;
    if (!currentState) return;
    useRoomStore.getState().setRoomState({
      ...currentState,
      playback: {
        ...currentState.playback,
        isPlaying,
        currentTime,
        updatedAt: Date.now()
      }
    });
  };

  // Throttled sync specifically for aggressive slider dragging
  const throttledSyncRef = useRef(
    throttle((isPlaying, newTime) => {
      if (onPlaybackChangeRef.current) {
        onPlaybackChangeRef.current({ isPlaying, currentTime: newTime });
      }
    }, 250)
  );

  useEffect(() => {
    onPlaybackChangeRef.current = onPlaybackChange;
    onVideoEndedRef.current = onVideoEnded;
  }, [onPlaybackChange, onVideoEnded]);

  useEffect(() => {
    return () => throttledSyncRef.current.cancel();
  }, []);

  const extractVideoId = (input) => {
    if (!input) return 'dQw4w9WgXcQ';
    const cleanInput = input.trim();
    if (cleanInput.length === 11) return cleanInput;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = cleanInput.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'dQw4w9WgXcQ';
  };

  // Initialize YouTube IFrame Player
  useEffect(() => {
    let checkYtInterval = null;

    const initPlayer = () => {
      if (playerCreatedRef.current) return;
      if (!window.YT || !window.YT.Player) return;
      const hostEl = document.getElementById('yt-player-element');
      if (!hostEl) return; // element not mounted yet — will retry on next poll

      const player = new window.YT.Player(hostEl, {
        height: '100%',
        width: '100%',
        videoId: extractVideoId(youtubeId),
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          widget_referrer: window.location.origin,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            setVideoLoadError(false);
            setIsPlayerReady(true);
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volume);
            if (isMuted) event.target.mute();
            // If a video change arrived while this player was initialising, apply it now
            const pending = pendingVideoRef.current;
            if (pending && typeof event.target.loadVideoById === 'function') {
              pendingVideoRef.current = null;
              isSelfSyncing.current = Date.now();
              event.target.loadVideoById({ videoId: pending.id, startSeconds: pending.start });
            }
          },
          onStateChange: (event) => {
            const player = event.target;
            const state = event.data;
            const nowTime = player.getCurrentTime();

            if (state === window.YT.PlayerState.PLAYING) {
              setLocalPlaying(true);
              localPlayingRef.current = true;
            } else if (state === window.YT.PlayerState.PAUSED) {
              setLocalPlaying(false);
              localPlayingRef.current = false;
            } else if (state === window.YT.PlayerState.ENDED) {
              setLocalPlaying(false);
              localPlayingRef.current = false;
              if (onVideoEndedRef.current) {
                onVideoEndedRef.current();
              }
            }

            // Extend lock if buffering happens soon after a programmatic seek
            if (state === window.YT.PlayerState.BUFFERING && (Date.now() - isSelfSyncing.current < 1500)) {
               isSelfSyncing.current = Date.now();
               return;
            }

            // Skip if we triggered this state change ourselves
            if (Date.now() - isSelfSyncing.current < 800) {
              // Echo-blocked, but keep the local store accurate anyway (e.g. native
              // YouTube controls used right after a remote sync). No broadcast here.
              if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.PAUSED) {
                syncLocalPlaybackState(state === window.YT.PlayerState.PLAYING, nowTime);
              }
              return;
            }

            // Broadcast
            if (state === window.YT.PlayerState.PLAYING) {
              onPlaybackChangeRef.current({ isPlaying: true, currentTime: nowTime });
            } else if (state === window.YT.PlayerState.PAUSED) {
              onPlaybackChangeRef.current({ isPlaying: false, currentTime: nowTime });
            }
          },
          onError: () => {
            setVideoLoadError(true);
          }
        }
      });
      playerRef.current = player;
      playerCreatedRef.current = true;
    };
    initPlayerRef.current = initPlayer;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    // Poll until both the API and the host element are ready, then build the player once
    initPlayer();
    if (!playerCreatedRef.current) {
      checkYtInterval = setInterval(() => {
        initPlayer();
        if (playerCreatedRef.current) clearInterval(checkYtInterval);
      }, 200);
    }

    return () => {
      if (checkYtInterval) clearInterval(checkYtInterval);
      initPlayerRef.current = null;
      playerCreatedRef.current = false;
      pendingVideoRef.current = null;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch (_) {}
      }
      playerRef.current = null;
    };
  }, []);

  // Boot timeout: if the player never fires onReady, surface a recovery UI
  useEffect(() => {
    if (isPlayerReady || videoLoadError) return;
    const timer = setTimeout(() => {
      if (!playerCreatedRef.current) return; // still waiting on API/host — keep waiting
      setVideoLoadError(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, [isPlayerReady, videoLoadError, youtubeId]);

  const handleRetryPlayer = () => {
    setVideoLoadError(false);
    setIsPlayerReady(false);
    playerCreatedRef.current = false;
    pendingVideoRef.current = null;
    if (initPlayerRef.current) initPlayerRef.current();
  };

  // Update video when youtubeId changes — auto-play immediately
  useEffect(() => {
    setVideoLoadError(false);
    if (!isPlayerReady) return;

    const targetId = extractVideoId(youtubeId);
    const player = playerRef.current;

    if (!player || typeof player.loadVideoById !== 'function') {
      // Player handle is stale/invalid (e.g. its iframe was recreated by React).
      // Queue the change and rebuild the player — onReady applies the pending video.
      pendingVideoRef.current = { id: targetId, start: playback?.currentTime || 0 };
      playerCreatedRef.current = false;
      if (initPlayerRef.current) initPlayerRef.current();
      return;
    }

    const currentIdInPlayer = player.getVideoData ? player.getVideoData().video_id : '';
    if (currentIdInPlayer !== targetId && targetId) {
      isSelfSyncing.current = Date.now();
      player.loadVideoById({ videoId: targetId, startSeconds: playback?.currentTime || 0 });
    }
  }, [youtubeId, isPlayerReady]);

  // ONE-SHOT join sync: seek to live position when player first becomes ready
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || !playback || hasJoinSyncedRef.current) return;
    hasJoinSyncedRef.current = true;

    const targetTime = playback.currentTime;
    if (targetTime > 2) {
      isSelfSyncing.current = Date.now();
      playerRef.current.seekTo(targetTime, true);
    }
  }, [isPlayerReady, playback]);

  // ONGOING peer sync: apply playback_synced events from server
  useEffect(() => {
    if (!syncedPlaybackEvent || !isPlayerReady || !playerRef.current) return;

    const { playback: serverPlayback } = syncedPlaybackEvent;
    if (!serverPlayback) return;

    const player = playerRef.current;
    const localTime = player.getCurrentTime() || 0;
    const targetTime = serverPlayback.currentTime;
    const drift = Math.abs(localTime - targetTime);

    isSelfSyncing.current = Date.now();

    if (serverPlayback.isPlaying) {
      if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) player.playVideo();
      if (drift > 0.5) player.seekTo(targetTime, true);
    } else {
      if (player.getPlayerState() !== window.YT.PlayerState.PAUSED) player.pauseVideo();
      if (drift > 0.5) {
        // If we need to seek while pausing, do it immediately after pausing.
        player.seekTo(targetTime, true);
        
        // Safety lock: ensure any buffering caused by this seek doesn't trigger a broadcast
        isSelfSyncing.current = Date.now() + 1000;
      }
    }
  }, [syncedPlaybackEvent, isPlayerReady]);

  // Reset the dismissed sync prompt for a new video or once the room pauses
  useEffect(() => {
    setSyncPromptDismissed(false);
  }, [youtubeId]);

  useEffect(() => {
    if (!playback?.isPlaying) setSyncPromptDismissed(false);
  }, [playback?.isPlaying]);

  // Progress ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime() || 0);
        if (playerRef.current.getDuration) setDuration(playerRef.current.getDuration() || 0);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleManualPlayPause = () => {
    if (!playerRef.current) return;
    
    // Explicitly lock the echo-blocker so onStateChange doesn't double-fire
    isSelfSyncing.current = Date.now();
    
    const nowTime = playerRef.current.getCurrentTime() || 0;
    const newIsPlaying = !localPlayingRef.current;
    
    newIsPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
    
    // Force the broadcast immediately bypassing onStateChange
    if (onPlaybackChangeRef.current) {
      onPlaybackChangeRef.current({ isPlaying: newIsPlaying, currentTime: nowTime });
    }
  };

  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current) {
      isSelfSyncing.current = Date.now();
      playerRef.current.seekTo(newTime, true);
      throttledSyncRef.current(localPlaying, newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (typeof window !== 'undefined') localStorage.setItem('together_volume', newVol.toString());
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        if (typeof window !== 'undefined') localStorage.setItem('together_isMuted', 'false');
      }
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      if (typeof window !== 'undefined') localStorage.setItem('together_isMuted', 'false');
    } else {
      playerRef.current.mute();
      setIsMuted(true);
      if (typeof window !== 'undefined') localStorage.setItem('together_isMuted', 'true');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        handleManualPlayPause();
      } else if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleMuteToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localPlaying, isMuted]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Live position of the room (server timestamp extrapolated), used to tell the
  // member how far behind they are and to catch them up when they hit sync.
  const roomLiveTime = playback?.isPlaying
    ? playback.currentTime + (Date.now() - (playback.updatedAt || Date.now())) / 1000
    : null;
  const behindSeconds = roomLiveTime != null ? Math.max(0, roomLiveTime - currentTime) : null;
  const behindLabel = behindSeconds != null && behindSeconds > 1
    ? `You're ${formatTime(Math.floor(behindSeconds))} behind the room`
    : 'Tap to resume playback';

  const handleSyncResume = () => {
    if (!playerRef.current) return;
    const player = playerRef.current;
    isSelfSyncing.current = Date.now();
    player.playVideo();
    // Catch up to the room's live position if we're meaningfully behind
    if (roomLiveTime != null && Math.abs((player.getCurrentTime() || 0) - roomLiveTime) > 2) {
      player.seekTo(roomLiveTime, true);
    }
  };

  return (
    <div className="relative w-full flex flex-col">
      {/* 16:9 Cinema Frame */}
      <div
        ref={containerRef}
        className="relative w-full pt-[56.25%] bg-black rounded-2xl overflow-hidden border border-outline shadow-xl"
      >
        <div
          id="yt-player-element"
          className="absolute top-0 left-0 w-full h-full"
        />

        {/* Load / Error Overlay — covers the black frame until the player is ready */}
        {(!isPlayerReady || videoLoadError) && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black px-6">
            {videoLoadError ? (
              <div className="flex w-full max-w-[92%] flex-col items-center gap-4 text-center animate-fade-in-up">
                <span className="material-symbols-outlined text-5xl text-white/85" aria-hidden="true">videocam_off</span>
                <p className="font-label-sm text-xs uppercase tracking-widest text-white/70">This video can't be played</p>
                <button
                  type="button"
                  onClick={handleRetryPlayer}
                  aria-label="Retry loading the video"
                  className="btn bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white px-5 py-2.5"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="text-4xl" label="Loading video" />
                <p className="font-label-sm text-xs uppercase tracking-widest text-white/60">Loading video…</p>
              </div>
            )}
          </div>
        )}

        {/* Autoplay Blocked Overlay — "Click to Sync" pill */}
        {isPlayerReady && playback?.isPlaying && !localPlaying && !syncPromptDismissed && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/15">
            <div className="pointer-events-auto flex w-full max-w-[92%] flex-col items-center gap-3 px-4 animate-fade-in-up">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncResume}
                  aria-label="Resume playback and sync with the room"
                  className="group flex items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 text-on-primary shadow-[0_8px_30px_rgba(205,0,0,0.45)] ring-1 ring-white/20 transition-all hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-7 sm:py-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 sm:h-8 sm:w-8">
                    <span className="material-symbols-outlined fill-1">play_arrow</span>
                  </span>
                  <span className="font-label-lg whitespace-nowrap">Click to Sync</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncPromptDismissed(true)}
                  aria-label="Dismiss sync prompt"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-10 sm:w-10"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <p className="max-w-[90%] text-center text-xs font-medium tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] sm:text-sm">
                {behindLabel}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <PlaybackControls
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        localPlaying={localPlaying}
        onManualPlayPause={handleManualPlayPause}
        onSeekChange={handleSeekChange}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        locked={allowMemberControls === false && hostId !== currentUserId}
      />
    </div>
  );
});
