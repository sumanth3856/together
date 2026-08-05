"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSocket } from '../hooks/useSocket';
import { useRoomStore } from '../store/useRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../store/useUIStore';
import { supabase } from '../lib/supabase';

const LandingPage = dynamic(() => import('../components/landing/LandingPage').then((mod) => mod.LandingPage), { ssr: false });
const RoomHeader = dynamic(() => import('../components/room/RoomHeader').then((mod) => mod.RoomHeader), { ssr: false });
const YouTubePlayer = dynamic(() => import('../components/player/YouTubePlayer').then((mod) => mod.YouTubePlayer), { ssr: false });
const VideoDetailsCard = dynamic(() => import('../components/player/VideoDetailsCard').then((mod) => mod.VideoDetailsCard), { ssr: false });
const MemberList = dynamic(() => import('../components/room/MemberList').then((mod) => mod.MemberList), { ssr: false });
const ChatPanel = dynamic(() => import('../components/chat/ChatPanel').then((mod) => mod.ChatPanel), { ssr: false });
const SearchAndQueuePanel = dynamic(() => import('../components/player/SearchAndQueuePanel').then((mod) => mod.SearchAndQueuePanel), { ssr: false });
const MobileTabBar = dynamic(() => import('../components/room/MobileTabBar').then((mod) => mod.MobileTabBar), { ssr: false });
const ToastStack = dynamic(() => import('../components/common/ToastStack').then((mod) => mod.ToastStack), { ssr: false });
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

export default function Page() {
  const {
    createRoom,
    joinRoom,
    leaveRoom,
    syncPlayback,
    sendChatMessage,
    sendReaction,
    playNext,
    addToQueue,
    removeFromQueue
  } = useSocket();

  const actions = useMemo(() => ({
    createRoom,
    joinRoom,
    leaveRoom,
    syncPlayback,
    sendChatMessage,
    sendReaction,
    addToQueue,
    removeFromQueue
  }), [createRoom, joinRoom, leaveRoom, syncPlayback, sendChatMessage, sendReaction, addToQueue, removeFromQueue]);

  const EMPTY_ARRAY = useMemo(() => [], []);
  const roomId = useRoomStore(state => state.roomState?.roomId);
  const hostId = useRoomStore(state => state.roomState?.hostId);
  const currentVideo = useRoomStore(state => state.roomState?.currentVideo);
  const members = useRoomStore(useShallow(state => state.roomState?.members || EMPTY_ARRAY));
  const videoQueueLength = useRoomStore(state => state.roomState?.videoQueue?.length || 0);
  const chatHistoryLength = useRoomStore(state => state.roomState?.chatHistory?.length || 0);
  const isConnected = useRoomStore(state => state.isConnected);
  const isReconnecting = useRoomStore(state => state.isReconnecting);
  const socketId = useRoomStore(state => state.socketId);
  const sessionEnded = useRoomStore(state => state.sessionEnded);

  const setToastNotification = useUIStore(state => state.setToastNotification);
  const incomingReaction = useUIStore(state => state.incomingReaction);

  const [initialRoomId, setInitialRoomId] = useState('');
  const [mobileActiveTab, setMobileActiveTab] = useState('video');
  const [isMobileScreen, setIsMobileScreen] = useState(false);
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

  // Handle auto-leave on logout
  useEffect(() => {
    if (hasCheckedSession && !user && roomId) {
      actions.leaveRoom();
    }
  }, [user, roomId, actions, hasCheckedSession]);

  // Responsive listener
  useEffect(() => {
    setIsMobileScreen(window.innerWidth < 768);
    const handleResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Warn on page reload when in a room
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (roomId) {
        e.preventDefault();
        e.returnValue = "Reloading this page will result in synchronization issues. Are you sure you want to reload?";
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomId]);

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

  // This effect syncs the URL to include the room ID when joining/creating
  useEffect(() => {
    if (roomId) {
      const newUrl = `${window.location.pathname}?room=${roomId}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [roomId]);

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

  const handleLeaveRoom = useCallback(async () => {
    try {
      await actions.leaveRoom();
    } catch (_) {}
    window.history.replaceState({ path: window.location.pathname }, '', window.location.pathname);
  }, [actions]);

  // ---------- Derived State ----------
  const currentMember = members.find((m) => m.socketIds?.includes(socketId));
  const isHost = hostId === currentMember?.userId;

  const handleVideoEnded = useCallback(() => {
    if (isHost) {
      if (videoQueueLength > 0) {
        setTimeout(() => {
          playNext();
        }, 500);
      } else {
        actions.syncPlayback({ isPlaying: false, hasEnded: true });
      }
    }
  }, [isHost, videoQueueLength, playNext, actions]);

  // ---------- Render ----------
  return (
    <div style={{ minHeight: '100dvh', position: 'relative', background: '#efede6' }}>

      {/* ── Reconnecting Banner ── */}
      {isReconnecting && !roomId && (
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
      {isReconnecting && roomId && (
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
      <ToastStack top={isReconnecting ? '48px' : '16px'} />

      {/* ── Reconnecting full-screen overlay (no room, no session ended) ── */}
      {isReconnecting && !roomId && !sessionEnded && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#efede6',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cd0000" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '6px' }}>Rejoining your room…</h2>
            <p style={{ color: '#5e3f3a', fontSize: '0.875rem' }}>Restoring your session, please wait.</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        </div>
      )}

      {/* ── Main Content ── */}
      {!hasCheckedSession && !roomId ? (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '400px', width: '100%', borderRadius: '16px' }} />
          <div style={{ display: 'flex', gap: '16px' }}>
             <div className="skeleton" style={{ height: '200px', flex: 1, borderRadius: '12px' }} />
             <div className="skeleton" style={{ height: '200px', flex: 1, borderRadius: '12px' }} />
          </div>
        </div>
      ) : !roomId ? (
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
              <AlertCircle size={36} color="#ba1a1a" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '10px', fontFamily: "var(--font-oswald), sans-serif" }}>
              Session Ended
            </h2>
            <p style={{ color: '#5e3f3a', marginBottom: '28px', maxWidth: '300px', lineHeight: 1.6, fontSize: '0.9rem' }}>
              The host left the room and ended the session. Thanks for watching together!
            </p>
            <button
              className="bg-primary text-on-primary hover:bg-surface-tint transition-colors shadow-md"
              onClick={() => window.location.href = '/'}
              style={{ padding: '12px 32px', borderRadius: '9999px', fontSize: '0.95rem' }}
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
        <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-8 max-w-[1600px] mx-auto">
          <RoomHeader
            onLeaveRoom={handleLeaveRoom}
            roomId={roomId}
            user={user}
          />

          {!isMobileScreen ? (
            /* ── Desktop / Tablet Grid ── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-104px)]">
              {/* Left Column: Video & Queue */}
              <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                <YouTubePlayer
                  youtubeId={currentVideo?.youtubeId}
                  onVideoEnded={handleVideoEnded}
                />
                
                {/* Meta details & queue could go here side-by-side or stacked */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">
                        <VideoDetailsCard
                          currentVideo={currentVideo}
                          roomState={{ roomId, hostId, currentVideo, members, videoQueue: Array(videoQueueLength).fill({}) }}
                          currentSocketId={socketId}
                          onLoadVideo={(vData) => actions.syncPlayback(vData)}
                        />
                        <MemberList
                          members={members}
                          currentSocketId={socketId}
                        />
                    </div>
                    
                    <div className="h-[400px] xl:h-auto">
                        <SearchAndQueuePanel
                          onAddVideo={(video) => actions.addToQueue(video)}
                          onPlayVideo={(video) => actions.syncPlayback({ youtubeId: video.youtubeId, title: video.title, isPlaying: true, currentTime: 0 })}
                          onRemoveVideo={(queueId) => actions.removeFromQueue(queueId)}
                        />
                    </div>
                </div>
              </div>

              {/* Right Column: Moments Chat */}
              <div className="lg:col-span-4 xl:col-span-3 h-full">
                <ChatPanel />
              </div>
            </div>
          ) : (
            /* ── Mobile View ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '70px' }}>
              <div className="mobile-sticky-player">
                <YouTubePlayer
                  youtubeId={currentVideo?.youtubeId}
                  onVideoEnded={handleVideoEnded}
                />
              </div>

              {mobileActiveTab === 'video' && (
                <>
                  <VideoDetailsCard
                    currentVideo={currentVideo}
                    roomState={{ roomId, hostId, currentVideo, members, videoQueue: Array(videoQueueLength).fill({}) }}
                    currentSocketId={socketId}
                    onLoadVideo={(vData) => actions.syncPlayback(vData)}
                  />
                  <div style={{ minHeight: '400px', flex: 1, marginTop: '14px' }}>
                    <SearchAndQueuePanel
                      onAddVideo={(video) => actions.addToQueue(video)}
                      onPlayVideo={(video) => actions.syncPlayback({ youtubeId: video.youtubeId, title: video.title, isPlaying: true, currentTime: 0 })}
                      onRemoveVideo={(queueId) => actions.removeFromQueue(queueId)}
                    />
                  </div>
                </>
              )}

              {mobileActiveTab === 'chat' && (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ChatPanel />
                </div>
              )}

              {mobileActiveTab === 'members' && (
                <MemberList
                  members={members}
                  currentSocketId={socketId}
                />
              )}

              <MobileTabBar
                activeTab={mobileActiveTab}
                onSelectTab={setMobileActiveTab}
                memberCount={members.length}
                chatCount={chatHistoryLength}
              />
            </div>
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
