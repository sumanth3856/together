import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Lock, Unlock, CheckCircle2, Radio, Volume2, VolumeX } from 'lucide-react';

export function YouTubePlayer({
  youtubeId,
  playback,
  isHost,
  hasControl,
  syncedPlaybackEvent,
  onPlaybackChange,
  onRequestControl
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const isSelfSyncing = useRef(0);

  // Helper to extract YouTube video ID from various URL formats
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
          controls: isHost || hasControl ? 1 : 0,
          disablekb: isHost || hasControl ? 0 : 1,
          enablejsapi: 1,
          origin: window.location.origin,
          widget_referrer: window.location.origin,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady: (event) => {
            setIsPlayerReady(true);
            setDuration(event.target.getDuration() || 0);
          },
          onStateChange: (event) => {
            // Ignore state changes if a sync/seek occurred in the last 1500ms
            if (Date.now() - isSelfSyncing.current < 1500) {
              return;
            }

            // Only user with control triggers sync broadcasts
            if (!isHost && !hasControl) return;

            const player = event.target;
            const state = event.data;
            const nowTime = player.getCurrentTime();

            if (state === window.YT.PlayerState.PLAYING) {
              setLocalPlaying(true);
              onPlaybackChange({ isPlaying: true, currentTime: nowTime });
            } else if (state === window.YT.PlayerState.PAUSED) {
              setLocalPlaying(false);
              onPlaybackChange({ isPlaying: false, currentTime: nowTime });
            }
          }
        }
      });
    };

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

  // Update video when youtubeId changes
  useEffect(() => {
    if (isPlayerReady && playerRef.current) {
      const currentIdInPlayer = playerRef.current.getVideoData ? playerRef.current.getVideoData().video_id : '';
      const targetId = extractVideoId(youtubeId);

      if (currentIdInPlayer !== targetId && targetId) {
        isSelfSyncing.current = Date.now();
        playerRef.current.loadVideoById(targetId, playback?.currentTime || 0);
      }
    }
  }, [youtubeId, isPlayerReady]);

  // Handle incoming Socket playback sync events from Host/Controller
  useEffect(() => {
    if (!syncedPlaybackEvent || !isPlayerReady || !playerRef.current) return;

    const { playback: serverPlayback } = syncedPlaybackEvent;
    if (!serverPlayback) return;

    const player = playerRef.current;
    const localTime = player.getCurrentTime() || 0;
    const targetTime = serverPlayback.currentTime;
    const drift = Math.abs(localTime - targetTime);

    isSelfSyncing.current = Date.now();

    // Auto-seek if drift is greater than 1.5 seconds
    if (drift > 1.5) {
      player.seekTo(targetTime, true);
    }

    if (serverPlayback.isPlaying) {
      if (player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
        player.playVideo();
        setLocalPlaying(true);
      }
    } else {
      if (player.getPlayerState() !== window.YT.PlayerState.PAUSED) {
        player.pauseVideo();
        setLocalPlaying(false);
      }
    }
  }, [syncedPlaybackEvent, isPlayerReady]);

  // Progress Bar Time Update Loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime() || 0);
        if (playerRef.current.getDuration) {
          setDuration(playerRef.current.getDuration() || 0);
        }
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
    if (!playerRef.current || (!isHost && !hasControl)) return;
    const player = playerRef.current;
    if (localPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current && (isHost || hasControl)) {
      isSelfSyncing.current = Date.now();
      playerRef.current.seekTo(newTime, true);
      onPlaybackChange({ isPlaying: localPlaying, currentTime: newTime });
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 16:9 Cinema Player Frame */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          background: '#000000',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div 
          id="yt-player-element" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
        />

        {/* Lock Overlay for Non-Controlling Guests */}
        {!isHost && !hasControl && (
          <div 
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: '#121620',
              border: '1px solid var(--border-subtle)',
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--status-warning)',
              fontWeight: '600'
            }}
          >
            <Lock size={12} color="var(--status-warning)" />
            <span>Host Controls Playback</span>
          </div>
        )}

        {/* Autoplay Blocked / Out of Sync Overlay */}
        {isPlayerReady && playback?.isPlaying && !localPlaying && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(9, 11, 16, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <button 
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.unMute();
                  setIsMuted(false);
                  playerRef.current.playVideo();
                }
              }}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '1rem', borderRadius: 'var(--radius-full)', boxShadow: '0 4px 12px rgba(88, 80, 236, 0.3)' }}
            >
              <Play size={20} />
              <span>Click to Sync & Unmute</span>
            </button>
            <span style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Browser blocked autoplay. Click to resume.
            </span>
          </div>
        )}
      </div>

      {/* Interactive Control Bar & Scrubber */}
      <div className="panel" style={{ marginTop: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Progress Bar Scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '40px' }}>
            {formatTime(currentTime)}
          </span>
          <input 
            type="range" 
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            disabled={!isHost && !hasControl}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              accentColor: 'var(--accent-primary)',
              cursor: isHost || hasControl ? 'pointer' : 'default'
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons & Volume */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {(isHost || hasControl) ? (
              <button 
                className="btn btn-primary" 
                onClick={handleManualPlayPause}
                style={{ borderRadius: 'var(--radius-full)', width: '38px', height: '38px', padding: 0 }}
              >
                {localPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
              </button>
            ) : (
              <button 
                className="btn btn-secondary" 
                onClick={onRequestControl}
                style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24', minHeight: '38px', fontSize: '0.8rem' }}
              >
                <Unlock size={14} />
                <span>Request Control</span>
              </button>
            )}

            {(isHost || hasControl) && (
              <span className="badge badge-control" style={{ fontSize: '0.65rem' }}>
                <CheckCircle2 size={10} /> Control Unlocked
              </span>
            )}
          </div>

          {/* Local Volume Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleMuteToggle}
              className="btn btn-ghost"
              style={{ padding: 0, width: '32px', height: '32px', minHeight: '32px' }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={16} color="var(--status-danger)" />
              ) : (
                <Volume2 size={16} color="var(--text-secondary)" />
              )}
            </button>
            <input 
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                width: '70px',
                height: '4px',
                accentColor: 'var(--accent-primary)',
                cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <Radio size={12} color="var(--status-success)" />
              <span>Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
