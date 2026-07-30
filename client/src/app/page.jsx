"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSocket } from '../hooks/useSocket';
import { useRoomStore } from '../store/useRoomStore';
import { useUIStore } from '../store/useUIStore';
import { supabase } from '../lib/supabase';

const LandingPage = dynamic(() => import('../components/landing/LandingPage').then((mod) => mod.LandingPage), { ssr: false });

import { RoomHeader } from '../components/room/RoomHeader';
import { YouTubePlayer } from '../components/player/YouTubePlayer';
import { VideoDetailsCard } from '../components/player/VideoDetailsCard';

import { MemberList } from '../components/room/MemberList';
import { ChatPanel } from '../components/chat/ChatPanel';
import { SearchAndQueuePanel } from '../components/player/SearchAndQueuePanel';
import { MobileTabBar } from '../components/room/MobileTabBar';
import { LeaveConfirmationModal } from '../components/room/LeaveConfirmationModal';
import { AlertCircle, CheckCircle2, X, Wifi, WifiOff } from 'lucide-react';

export default function Page() {
  const {
    createRoom,
    joinRoom,
    leaveRoom,
    syncPlayback,
    sendChatMessage,
    sendReaction,
    playNext
  } = useSocket();

  const actions = useMemo(() => ({
    createRoom,
    joinRoom,
    leaveRoom,
    syncPlayback,
    sendChatMessage,
    sendReaction
  }), [createRoom, joinRoom, leaveRoom, syncPlayback, sendChatMessage, sendReaction]);

  const roomState = useRoomStore(state => state.roomState);
  const isConnected = useRoomStore(state => state.isConnected);
  const isReconnecting = useRoomStore(state => state.isReconnecting);
  const socketId = useRoomStore(state => state.socketId);
  const sessionEnded = useRoomStore(state => state.sessionEnded);
  const syncedPlaybackEvent = useRoomStore(state => state.syncedPlaybackEvent);

  const toasts = useUIStore(state => state.toasts);
  const setToastNotification = useUIStore(state => state.setToastNotification);
  const removeToast = useUIStore(state => state.removeToast);
  const incomingReaction = useUIStore(state => state.incomingReaction);

  const [initialRoomId, setInitialRoomId] = useState('');
  const [mobileActiveTab, setMobileActiveTab] = useState('video');
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [user, setUser] = useState(null);

  // Check Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Responsive listener
  useEffect(() => {
    setIsMobileScreen(window.innerWidth < 768);
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-fill room ID from URL (for invite links)
  // hasCheckedSession stays false until the socket has had a chance to
  // attempt a rejoin, so we never flash the LandingPage mid-reconnect.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const session = localStorage.getItem('tg_session');
    if (!session) {
      // No saved session — show LandingPage immediately
      setHasCheckedSession(true);
    }
    // If session exists, hasCheckedSession stays false;
    // it will be set to true once isReconnecting flips to false (see effect below).
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomId(roomParam.toUpperCase());
    }
  }, []);

  // Once the rejoin attempt finishes (isReconnecting→false), unlock the UI.
  // This covers both: successful rejoin (roomState set) and failed rejoin (show LandingPage).
  useEffect(() => {
    if (!isReconnecting) {
      setHasCheckedSession(true);
    }
  }, [isReconnecting]);

  // Update URL when room state changes (keeps URL in sync)
  useEffect(() => {
    if (roomState?.roomId) {
      const newUrl = `${window.location.pathname}?room=${roomState.roomId}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [roomState?.roomId]);

  // ---------- Handlers ----------

  const handleCreateRoom = useCallback(async (userId, nickname, avatar) => {
    try {
      await actions.createRoom(userId, nickname, avatar);
    } catch (err) {
      setToastNotification({ type: 'error', message: `Failed to create room: ${err}` });
    }
  }, [actions, setToastNotification]);

  const handleJoinRoom = useCallback(async (roomId, userId, nickname, avatar) => {
    try {
      await actions.joinRoom(roomId, userId, nickname, avatar);
    } catch (err) {
      setToastNotification({ type: 'error', message: `Room not found. Check the code and try again.` });
    }
  }, [actions, setToastNotification]);

  const handleLeaveRoom = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  const confirmLeaveRoom = useCallback(async () => {
    setShowLeaveModal(false);
    try {
      await actions.leaveRoom();
    } catch (_) {}
    window.location.href = window.location.pathname;
  }, [actions]);

  // ---------- Derived State ----------
  const currentMember = roomState?.members?.find((m) => m.socketIds?.includes(socketId));
  const isHost = roomState?.hostId === currentMember?.userId;

  const handleVideoEnded = useCallback(() => {
    if (isHost && roomState?.videoQueue?.length > 0) {
      playNext();
    }
  }, [isHost, roomState?.videoQueue?.length, playNext]);

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

      {/* ── Toast Notifications Stack ── */}
      <div style={{
        position: 'fixed',
        top: isReconnecting ? '48px' : '16px',
        right: '16px',
        left: isMobileScreen ? '16px' : 'auto',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{
            pointerEvents: 'auto',
            maxWidth: '380px',
            animation: 'slideInRight 0.25s ease',
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px',
            background: 'var(--bg-surface-2)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(244,63,94,0.35)' : 'rgba(99,102,241,0.35)'}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: toast.type === 'error' ? 'rgba(244,63,94,0.12)' : 'var(--accent-primary-dim)',
              border: `1px solid ${toast.type === 'error' ? 'rgba(244,63,94,0.22)' : 'rgba(99,102,241,0.22)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {toast.type === 'error'
                ? <AlertCircle size={15} color="var(--status-danger)" />
                : <CheckCircle2 size={15} color="var(--accent-primary)" />}
            </div>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', borderRadius: 'var(--radius-sm)', display: 'flex', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

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
      {!hasCheckedSession && !roomState ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
          <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
        </div>
      ) : !roomState ? (
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
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '10px', fontFamily: "var(--font-outfit), sans-serif" }}>
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
          /* Landing Page — only show if NOT reconnecting */
          <LandingPage
            initialRoomId={initialRoomId}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            user={user}
          />
        ) : null
      ) : (
        /* ── Main Co-Watching Room View ── */
        <div
          className="room-container"
          style={{ maxWidth: '1380px', margin: '0 auto', padding: isMobileScreen ? '10px' : '14px 20px', minHeight: '100dvh' }}
        >
          <RoomHeader
            onLeaveRoom={handleLeaveRoom}
            roomId={roomState.roomId}
          />

          {!isMobileScreen ? (
            /* ── Desktop / Tablet Grid ── */
            <div className="desktop-grid">
              <div>
                <YouTubePlayer
                  youtubeId={roomState.currentVideo?.youtubeId}
                  playback={roomState.playback}
                  syncedPlaybackEvent={syncedPlaybackEvent}
                  onPlaybackChange={(pData) => actions.syncPlayback(pData)}
                  onVideoEnded={handleVideoEnded}
                />
                <VideoDetailsCard
                  currentVideo={roomState.currentVideo}
                  roomState={roomState}
                  currentSocketId={socketId}
                  onLoadVideo={(vData) => actions.syncPlayback(vData)}
                />

                <MemberList
                  members={roomState.members}
                  currentSocketId={socketId}
                />
                
                <div style={{ height: '400px', marginTop: '14px' }}>
                  <SearchAndQueuePanel />
                </div>
              </div>

              <div className="chat-sidebar">
                <ChatPanel
                  chatHistory={roomState.chatHistory}
                  incomingReaction={incomingReaction}
                  onSendMessage={actions.sendChatMessage}
                  onSendReaction={actions.sendReaction}
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
                  syncedPlaybackEvent={syncedPlaybackEvent}
                  onPlaybackChange={(pData) => actions.syncPlayback(pData)}
                  onVideoEnded={handleVideoEnded}
                />
              </div>

              {mobileActiveTab === 'video' && (
                <VideoDetailsCard
                  currentVideo={roomState.currentVideo}
                  roomState={roomState}
                  currentSocketId={socketId}
                  onLoadVideo={(vData) => actions.syncPlayback(vData)}
                />
              )}

              {mobileActiveTab === 'chat' && (
                <div style={{ height: 'calc(100dvh - 280px)', minHeight: '300px' }}>
                  <ChatPanel
                    chatHistory={roomState.chatHistory}
                    incomingReaction={incomingReaction}
                    onSendMessage={actions.sendChatMessage}
                    onSendReaction={actions.sendReaction}
                  />
                </div>
              )}

              {mobileActiveTab === 'members' && (
                <MemberList
                  members={roomState.members}
                  currentSocketId={socketId}
                />
              )}

              {mobileActiveTab === 'search' && (
                <div style={{ height: 'calc(100dvh - 280px)', minHeight: '300px' }}>
                  <SearchAndQueuePanel />
                </div>
              )}

              <MobileTabBar
                activeTab={mobileActiveTab}
                onSelectTab={setMobileActiveTab}
                memberCount={roomState.members.length}
                chatCount={roomState.chatHistory.length}
              />
            </div>
          )}

          {/* Leave Confirmation Modal */}
          {showLeaveModal && (
            <LeaveConfirmationModal
              onConfirm={confirmLeaveRoom}
              onCancel={() => setShowLeaveModal(false)}
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
