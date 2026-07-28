"use client";

import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { JoinRoomModal } from '../components/room/JoinRoomModal';
import { RoomHeader } from '../components/room/RoomHeader';
import { YouTubePlayer } from '../components/player/YouTubePlayer';
import { VideoDetailsCard } from '../components/player/VideoDetailsCard';
import { VideoQueue } from '../components/player/VideoQueue';
import { MemberList } from '../components/room/MemberList';
import { ChatPanel } from '../components/chat/ChatPanel';
import { ControlRequestModal } from '../components/room/ControlRequestModal';
import { MobileTabBar } from '../components/room/MobileTabBar';
import { AlertCircle, CheckCircle2, X, Wifi, WifiOff } from 'lucide-react';

export default function Page() {
  const {
    socket,
    isConnected,
    isReconnecting,
    roomState,
    sessionEnded,
    toastNotification,
    setToastNotification,
    controlRequestNotice,
    setControlRequestNotice,
    incomingReaction,
    syncedPlaybackEvent,
    createRoom,
    joinRoom,
    leaveRoom,
    syncPlayback,
    requestControl,
    respondControlRequest,
    revokeControl,
    sendChatMessage,
    sendReaction
  } = useSocket();

  const [initialRoomId, setInitialRoomId] = useState('');
  const [mobileActiveTab, setMobileActiveTab] = useState('video');
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Responsive listener
  useEffect(() => {
    setIsMobileScreen(window.innerWidth < 768);
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-fill room ID from URL if no session active (for invite links with no saved nickname)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomId(roomParam.toUpperCase());
    }
  }, []);

  // Update URL when room state changes (keeps URL in sync)
  useEffect(() => {
    if (roomState?.roomId) {
      const newUrl = `${window.location.pathname}?room=${roomState.roomId}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [roomState?.roomId]);

  // ---------- Handlers ----------

  const handleCreateRoom = async (nickname) => {
    try {
      await createRoom(nickname);
    } catch (err) {
      setToastNotification({ type: 'error', message: `Failed to create room: ${err}` });
    }
  };

  const handleJoinRoom = async (roomId, nickname) => {
    try {
      await joinRoom(roomId, nickname);
    } catch (err) {
      // Show a friendly toast instead of browser alert
      setToastNotification({ type: 'error', message: `Room not found. Check the code and try again.` });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
    } catch (_) {}
    // Navigate home, clearing the room param from the URL
    window.location.href = window.location.pathname;
  };

  // ---------- Derived State ----------
  const currentMember = roomState?.members?.find((m) => m.socketId === socket?.id);
  const isHost = currentMember?.isHost || false;
  const hasControl = currentMember?.hasControl || false;

  // ---------- Render ----------
  return (
    <div style={{ minHeight: '100dvh', position: 'relative', background: 'var(--bg-primary)' }}>

      {/* ── Reconnecting Banner ── */}
      {isReconnecting && !roomState && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20000,
          background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.25)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          backdropFilter: 'blur(8px)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: '600' }}>
            Reconnecting to your session…
          </span>
        </div>
      )}

      {/* ── Reconnecting Banner (in-room disconnect) ── */}
      {isReconnecting && roomState && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20000,
          background: 'rgba(245,158,11,0.10)', borderBottom: '1px solid rgba(245,158,11,0.2)',
          padding: '6px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <WifiOff size={13} color="#f59e0b" />
          <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: '600' }}>
            Connection lost — reconnecting…
          </span>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toastNotification && (
        <div style={{
          position: 'fixed',
          top: isReconnecting ? '48px' : '16px',
          right: '16px',
          left: isMobileScreen ? '16px' : 'auto',
          zIndex: 10000,
          maxWidth: '380px',
          animation: 'slideInRight 0.25s ease',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px',
            background: 'var(--bg-surface-2)',
            border: `1px solid ${toastNotification.type === 'error' ? 'rgba(244,63,94,0.35)' : 'rgba(99,102,241,0.35)'}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: toastNotification.type === 'error' ? 'rgba(244,63,94,0.12)' : 'var(--accent-primary-dim)',
              border: `1px solid ${toastNotification.type === 'error' ? 'rgba(244,63,94,0.22)' : 'rgba(99,102,241,0.22)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {toastNotification.type === 'error'
                ? <AlertCircle size={15} color="var(--status-danger)" />
                : <CheckCircle2 size={15} color="var(--accent-primary)" />}
            </div>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>
              {toastNotification.message}
            </span>
            <button
              onClick={() => setToastNotification(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', borderRadius: 'var(--radius-sm)', display: 'flex', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Reconnecting full-screen overlay (no room, no session ended) ── */}
      {isReconnecting && !roomState && !sessionEnded && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '6px' }}>Rejoining your room…</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Restoring your session, please wait.</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        </div>
      )}

      {/* ── Main Content ── */}
      {!roomState ? (
        sessionEnded ? (
          /* Session Ended Screen */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100dvh', padding: '24px', textAlign: 'center',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px', boxShadow: '0 0 40px rgba(244,63,94,0.12)',
            }}>
              <AlertCircle size={36} color="var(--status-danger)" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '10px', fontFamily: "'Outfit', sans-serif" }}>
              Session Ended
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '300px', lineHeight: 1.6, fontSize: '0.9rem' }}>
              The host left the room and ended the session. Thanks for watching together!
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = '/'}
              style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)', fontSize: '0.95rem' }}
            >
              Return Home
            </button>
          </div>
        ) : !isReconnecting ? (
          /* Landing / Join Page — only show if NOT reconnecting */
          <JoinRoomModal
            initialRoomId={initialRoomId}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        ) : null
      ) : (
        /* ── Main Co-Watching Room View ── */
        <div
          className="room-container"
          style={{ maxWidth: '1380px', margin: '0 auto', padding: isMobileScreen ? '10px' : '14px 20px', minHeight: '100dvh' }}
        >
          <RoomHeader
            roomId={roomState.roomId}
            memberCount={roomState.members.length}
            isHost={isHost}
            isConnected={isConnected}
            onLeaveRoom={handleLeaveRoom}
          />

          {!isMobileScreen ? (
            /* ── Desktop / Tablet Grid ── */
            <div className="desktop-grid">
              <div>
                <YouTubePlayer
                  youtubeId={roomState.currentVideo?.youtubeId}
                  playback={roomState.playback}
                  isHost={isHost}
                  hasControl={hasControl}
                  syncedPlaybackEvent={syncedPlaybackEvent}
                  onPlaybackChange={(pData) => syncPlayback(pData)}
                  onRequestControl={requestControl}
                />
                <VideoDetailsCard
                  currentVideo={roomState.currentVideo}
                  roomState={roomState}
                  currentSocketId={socket?.id}
                  isHost={isHost}
                  hasControl={hasControl}
                  onRequestControl={requestControl}
                />
                <VideoQueue
                  isHost={isHost}
                  hasControl={hasControl}
                  currentVideo={roomState.currentVideo}
                  onChangeVideo={(vData) => syncPlayback(vData)}
                />
                <MemberList
                  members={roomState.members}
                  currentSocketId={socket?.id}
                  isHost={isHost}
                  onGrantControl={(targetId, approved) => respondControlRequest(targetId, approved)}
                  onRevokeControl={(targetId) => revokeControl(targetId)}
                />
              </div>

              <div className="chat-sidebar">
                <ChatPanel
                  chatHistory={roomState.chatHistory}
                  incomingReaction={incomingReaction}
                  onSendMessage={sendChatMessage}
                  onSendReaction={sendReaction}
                />
              </div>
            </div>
          ) : (
            /* ── Mobile View ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="mobile-sticky-player">
                <YouTubePlayer
                  youtubeId={roomState.currentVideo?.youtubeId}
                  playback={roomState.playback}
                  isHost={isHost}
                  hasControl={hasControl}
                  syncedPlaybackEvent={syncedPlaybackEvent}
                  onPlaybackChange={(pData) => syncPlayback(pData)}
                  onRequestControl={requestControl}
                />
              </div>

              {mobileActiveTab === 'video' && (
                <VideoDetailsCard
                  currentVideo={roomState.currentVideo}
                  roomState={roomState}
                  currentSocketId={socket?.id}
                  isHost={isHost}
                  hasControl={hasControl}
                  onRequestControl={requestControl}
                />
              )}

              {mobileActiveTab === 'chat' && (
                <div style={{ height: 'calc(100dvh - 280px)', minHeight: '300px' }}>
                  <ChatPanel
                    chatHistory={roomState.chatHistory}
                    incomingReaction={incomingReaction}
                    onSendMessage={sendChatMessage}
                    onSendReaction={sendReaction}
                  />
                </div>
              )}

              {mobileActiveTab === 'members' && (
                <MemberList
                  members={roomState.members}
                  currentSocketId={socket?.id}
                  isHost={isHost}
                  onGrantControl={(targetId, approved) => respondControlRequest(targetId, approved)}
                  onRevokeControl={(targetId) => revokeControl(targetId)}
                />
              )}

              {mobileActiveTab === 'queue' && (
                <VideoQueue
                  isHost={isHost}
                  hasControl={hasControl}
                  currentVideo={roomState.currentVideo}
                  onChangeVideo={(vData) => syncPlayback(vData)}
                />
              )}

              <MobileTabBar
                activeTab={mobileActiveTab}
                onSelectTab={setMobileActiveTab}
                memberCount={roomState.members.length}
                chatCount={roomState.chatHistory.length}
              />
            </div>
          )}

          {/* Host Control Request Modal */}
          {isHost && (
            <ControlRequestModal
              requestNotice={controlRequestNotice}
              onRespond={(targetId, approved) => respondControlRequest(targetId, approved)}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
