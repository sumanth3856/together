import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import throttle from 'lodash/throttle';
import { PlaybackControls } from './PlaybackControls';
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
  const isSelfSyncing = useRef(0);
  const hasJoinSyncedRef = useRef(false);

  // Use refs to avoid stale closures in YouTube iframe event listeners
  const onPlaybackChangeRef = useRef(onPlaybackChange);
  const onVideoEndedRef = useRef(onVideoEnded);

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
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player-element', {
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
            setIsPlayerReady(true);
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volume);
            if (isMuted) event.target.mute();
          },
          onStateChange: (event) => {
            const player = event.target;
            const state = event.data;
            const nowTime = player.getCurrentTime();

            if (state === window.YT.PlayerState.PLAYING) {
              setLocalPlaying(true);
            } else if (state === window.YT.PlayerState.PAUSED) {
              setLocalPlaying(false);
            } else if (state === window.YT.PlayerState.ENDED) {
              setLocalPlaying(false);
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
            if (Date.now() - isSelfSyncing.current < 800) return;

            // Broadcast
            if (state === window.YT.PlayerState.PLAYING) {
              onPlaybackChangeRef.current({ isPlaying: true, currentTime: nowTime });
            } else if (state === window.YT.PlayerState.PAUSED) {
              onPlaybackChangeRef.current({ isPlaying: false, currentTime: nowTime });
            }
          }
        }
      });
    };

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

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      checkYtInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkYtInterval);
          initPlayer();
        }
      }, 200);
    }

    return () => {
      if (checkYtInterval) clearInterval(checkYtInterval);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Update video when youtubeId changes — auto-play immediately
  useEffect(() => {
    if (isPlayerReady && playerRef.current) {
      const currentIdInPlayer = playerRef.current.getVideoData ? playerRef.current.getVideoData().video_id : '';
      const targetId = extractVideoId(youtubeId);

      if (currentIdInPlayer !== targetId && targetId) {
        isSelfSyncing.current = Date.now();
        playerRef.current.loadVideoById({ videoId: targetId, startSeconds: playback?.currentTime || 0 });
      }
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
    const newIsPlaying = !localPlaying;
    
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

        {/* Autoplay Blocked Overlay */}
        {isPlayerReady && playback?.isPlaying && !localPlaying && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-fade-in-up">
            <button
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.playVideo();
                }
              }}
              className="bg-primary/90 backdrop-blur-md text-on-primary px-6 py-2.5 rounded-full font-label-lg shadow-[0_4px_20px_rgba(205,0,0,0.4)] flex items-center gap-2 hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined fill-1">play_arrow</span>
              <span>Click to Sync</span>
            </button>
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
