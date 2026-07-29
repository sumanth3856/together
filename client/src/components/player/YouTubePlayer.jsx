import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Lock } from 'lucide-react';
import throttle from 'lodash/throttle';
import { PlaybackControls } from './PlaybackControls';

export const YouTubePlayer = React.memo(function YouTubePlayer({
  youtubeId,
  playback,
  syncedPlaybackEvent,
  onPlaybackChange
}) {
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
  }, [onPlaybackChange]);

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

            // Always update local playing state for the overlay
            if (state === window.YT.PlayerState.PLAYING) {
              setLocalPlaying(true);
            } else if (state === window.YT.PlayerState.PAUSED) {
              setLocalPlaying(false);
            }

            // Skip if we triggered this state change ourselves
            if (Date.now() - isSelfSyncing.current < 1500) return;

            // Removed permission check — everyone can broadcast playback
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

    if (drift > 2) player.seekTo(targetTime, true);

    if (serverPlayback.isPlaying) {
      if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) player.playVideo();
    } else {
      if (player.getPlayerState() !== window.YT.PlayerState.PAUSED) player.pauseVideo();
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
    localPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
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
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 16:9 Cinema Frame */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: '#000',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div
          id="yt-player-element"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        />

        {/* Autoplay Blocked Overlay */}
        {isPlayerReady && playback?.isPlaying && !localPlaying && (
          <div style={{
            position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 20, animation: 'fadeIn 0.3s ease',
          }}>
            <button
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.playVideo();
                }
              }}
              className="btn btn-primary"
              style={{
                padding: '8px 18px', fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 4px 16px rgba(1,69,242,0.4)',
                background: 'rgba(1, 69, 242, 0.95)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Play size={16} />
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
      />
    </div>
  );
});
