import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Lock, Unlock, CheckCircle2, Signal, Volume2, VolumeX } from 'lucide-react';

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
  const hasJoinSyncedRef = useRef(false);

  // Use refs to avoid stale closures in YouTube iframe event listeners
  const isHostRef = useRef(isHost);
  const hasControlRef = useRef(hasControl);
  const onPlaybackChangeRef = useRef(onPlaybackChange);

  useEffect(() => {
    isHostRef.current = isHost;
    hasControlRef.current = hasControl;
    onPlaybackChangeRef.current = onPlaybackChange;
  }, [isHost, hasControl, onPlaybackChange]);

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
          rel: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            setIsPlayerReady(true);
            setDuration(event.target.getDuration() || 0);
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

            // Only broadcast if user has control
            if (!isHostRef.current && !hasControlRef.current) return;

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
    if (!playerRef.current || (!isHost && !hasControl)) return;
    localPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
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
      if (newVol > 0 && isMuted) { playerRef.current.unMute(); setIsMuted(false); }
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) { playerRef.current.unMute(); setIsMuted(false); }
    else { playerRef.current.mute(); setIsMuted(true); }
  };

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

        {/* Guest Lock Indicator */}
        {!isHost && !hasControl && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '4px 10px', borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: '600'
          }}>
            <Lock size={11} color="var(--accent-amber)" />
            <span>Host Controls</span>
          </div>
        )}

        {/* Autoplay Blocked Overlay */}
        {isPlayerReady && playback?.isPlaying && !localPlaying && (
          <div className="player-overlay">
            <button
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.unMute();
                  setIsMuted(false);
                  playerRef.current.playVideo();
                }
              }}
              className="btn btn-primary"
              style={{
                padding: '12px 28px', fontSize: '1rem',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 4px 24px rgba(99,102,241,0.5)',
              }}
            >
              <Play size={20} />
              <span>Sync &amp; Unmute</span>
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Browser blocked autoplay. Click to join the stream.
            </span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="panel" style={{
        marginTop: '10px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'var(--bg-surface)',
      }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', minWidth: '38px', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(currentTime)}
          </span>
          <div style={{ flex: 1, position: 'relative', height: '4px' }}>
            {/* Track background */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '2px',
            }} />
            {/* Progress fill */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${progressPercent}%`,
              background: 'var(--accent-primary)',
              borderRadius: '2px',
              transition: 'width 0.5s linear',
              boxShadow: '0 0 6px rgba(99,102,241,0.5)',
            }} />
            {/* Invisible range input */}
            <input
              type="range"
              min={0} max={duration || 100} step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              disabled={!isHost && !hasControl}
              style={{
                position: 'absolute', inset: '-6px 0',
                width: '100%', opacity: 0,
                cursor: isHost || hasControl ? 'pointer' : 'default',
                height: '16px',
              }}
            />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', minWidth: '38px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          {/* Left — Play/Pause & Control Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {(isHost || hasControl) ? (
              <button
                className="btn btn-primary"
                onClick={handleManualPlayPause}
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', padding: 0, boxShadow: '0 2px 10px rgba(99,102,241,0.4)' }}
                title={localPlaying ? 'Pause' : 'Play'}
              >
                {localPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '1px' }} />}
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={onRequestControl}
                style={{
                  minHeight: '36px', fontSize: '0.78rem',
                  borderColor: 'rgba(245,158,11,0.25)',
                  color: 'var(--accent-amber)',
                  background: 'rgba(245,158,11,0.06)',
                }}
              >
                <Unlock size={13} />
                <span>Request Control</span>
              </button>
            )}
            {(isHost || hasControl) && (
              <span className="badge badge-control" style={{ fontSize: '0.62rem' }}>
                <CheckCircle2 size={9} /> Controlling
              </span>
            )}
          </div>

          {/* Right — Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleMuteToggle}
              className="btn btn-ghost"
              style={{ padding: 0, width: '30px', height: '30px', minHeight: '30px', borderRadius: 'var(--radius-full)' }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0
                ? <VolumeX size={15} color="var(--status-danger)" />
                : <Volume2 size={15} color="var(--text-secondary)" />}
            </button>
            <input
              type="range" min={0} max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ width: '68px', height: '3px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              <Signal size={11} color="var(--status-success)" />
              <span>Synced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
