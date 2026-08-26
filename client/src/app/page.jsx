"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSocket } from '../hooks/useSocket';
import { useRoomStore } from '../store/useRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../store/useUIStore';
import { supabase } from '../lib/supabase';
import { sanitizeAuthUrl } from '../lib/urlSecurity';
import { Skeleton } from '../components/common/Skeleton';
import { LoadingScreen } from '../components/common/LoadingScreen';

const LoadingPageFallback = () => <LoadingScreen label="Loading Being Us" />;

const LandingPage = dynamic(() => import('../components/landing/LandingPage').then((mod) => mod.LandingPage), { ssr: false, loading: LoadingPageFallback });
const RoomHeader = dynamic(() => import('../components/room/RoomHeader').then((mod) => mod.RoomHeader), { ssr: false, loading: () => <Skeleton className="h-16 w-full rounded-none" /> });
const VideoPlayer = dynamic(() => import('../components/player/VideoPlayer').then((mod) => mod.VideoPlayer), { ssr: false, loading: () => <Skeleton className="aspect-video w-full rounded-2xl" /> });
const VideoDetailsCard = dynamic(() => import('../components/player/VideoDetailsCard').then((mod) => mod.VideoDetailsCard), { ssr: false, loading: () => <Skeleton className="h-44 w-full rounded-3xl" /> });
const MemberList = dynamic(() => import('../components/room/MemberList').then((mod) => mod.MemberList), { ssr: false, loading: () => <Skeleton className="h-28 w-full rounded-3xl" /> });
const ChatPanel = dynamic(() => import('../components/chat/ChatPanel').then((mod) => mod.ChatPanel), { ssr: false, loading: () => <Skeleton className="h-full min-h-[320px] w-full rounded-3xl" /> });
const SearchAndQueuePanel = dynamic(() => import('../components/player/SearchAndQueuePanel').then((mod) => mod.SearchAndQueuePanel), { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-3xl" /> });
const MobileTabBar = dynamic(() => import('../components/room/MobileTabBar').then((mod) => mod.MobileTabBar), { ssr: false });
const ToastStack = dynamic(() => import('../components/common/ToastStack').then((mod) => mod.ToastStack), { ssr: false });

const EMPTY_MEMBERS_ARRAY = [];

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

  const roomId = useRoomStore(state => state.roomState?.roomId);
  const hostId = useRoomStore(state => state.roomState?.hostId);
  const currentVideo = useRoomStore(state => state.roomState?.currentVideo);
  const members = useRoomStore(useShallow(state => state.roomState?.members || EMPTY_MEMBERS_ARRAY));
  const videoQueueLength = useRoomStore(state => state.roomState?.videoQueue?.length || 0);
  const chatHistoryLength = useRoomStore(state => state.roomState?.chatHistory?.length || 0);
  const isConnected = useRoomStore(state => state.isConnected);
  const isReconnecting = useRoomStore(state => state.isReconnecting);
  const socketId = useRoomStore(state => state.socketId);
  const sessionEnded = useRoomStore(state => state.sessionEnded);

  const setToastNotification = useUIStore(state => state.setToastNotification);
  const incomingReaction = useUIStore(state => state.incomingReaction);

  const [initialRoomId, setInitialRoomId] = useState('');
  const [desktopTab, setDesktopTab] = useState('search_queue');
  const [mobileActiveTab, setMobileActiveTab] = useState('video');
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [user, setUser] = useState(null);

  // Check Supabase Auth & Purge Sensitive URL tokens
  useEffect(() => {
    sanitizeAuthUrl();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      sanitizeAuthUrl();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      sanitizeAuthUrl();
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
      const cleanRoom = roomParam.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      if (cleanRoom.length >= 3) {
        setInitialRoomId(cleanRoom);
      }
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
          <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#f59e0b' }}>wifi_off</span>
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
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
      )}

      {/* ── Main Content ── */}
      {!hasCheckedSession && !roomId ? (
        <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-8 px-6 py-24">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <div className="flex gap-4">
            <Skeleton className="h-48 flex-1 rounded-xl" />
            <Skeleton className="h-48 flex-1 rounded-xl" />
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
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#ba1a1a' }}>error</span>
            </div>
            <h2 className="font-display-lg text-3xl md:text-4xl font-extrabold mb-3 text-on-background">
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
        <div className="h-screen max-h-screen overflow-hidden bg-background flex flex-col">
          <RoomHeader
            onLeaveRoom={handleLeaveRoom}
            roomId={roomId}
            user={user}
          />

          <div className="flex-1 min-h-0 pt-16 md:pt-20 px-3 sm:px-4 md:px-6 pb-2 sm:pb-3 max-w-[1700px] w-full mx-auto">
            {!isMobileScreen ? (
              /* ── Desktop / Tablet Flex Grid (100% Viewport Locked) ── */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6 h-full min-h-0">
                {/* Left Column: Video + Sub-tabbed Workspace (Search/Queue vs Room/Members) */}
                <main className="lg:col-span-8 xl:col-span-9 flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar scroll-smooth pr-1.5 pb-12 overscroll-contain">
                  <VideoPlayer
                    videoUrl={currentVideo?.videoUrl || currentVideo?.youtubeId}
                    onPlaybackChange={(pData) => actions.syncPlayback(pData)}
                    onVideoEnded={handleVideoEnded}
                  />
                  
                  {/* Segmented Workspace Tabs below player */}
                  <div className="mt-3 flex flex-col flex-1 min-h-0">
                    <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-2 mb-3 shrink-0">
                      <button
                        onClick={() => setDesktopTab('search_queue')}
                        className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-label-md transition-all flex items-center gap-2 ${desktopTab === 'search_queue' ? 'bg-surface-container-high text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-background'}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">video_library</span>
                        Search & Queue
                        {videoQueueLength > 0 && (
                          <span className="badge badge-primary px-1.5 py-0.2 text-[10px]">{videoQueueLength}</span>
                        )}
                      </button>
                      <button
                        onClick={() => setDesktopTab('room_members')}
                        className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-label-md transition-all flex items-center gap-2 ${desktopTab === 'room_members' ? 'bg-surface-container-high text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-background'}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        Room & Members ({members.length})
                      </button>
                    </div>

                    <div className="flex-1 min-h-0 pb-6">
                      {desktopTab === 'search_queue' && (
                        <div className="h-[460px] min-h-[400px] flex flex-col">
                          <SearchAndQueuePanel
                            onAddVideo={(video) => actions.addToQueue(video)}
                            onPlayVideo={(video) => actions.syncPlayback({ youtubeId: video.youtubeId, title: video.title, isPlaying: true, currentTime: 0 })}
                            onRemoveVideo={(queueId) => actions.removeFromQueue(queueId)}
                          />
                        </div>
                      )}
                      {desktopTab === 'room_members' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
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
                      )}
                    </div>
                  </div>
                </main>

                {/* Right Column: Moments Chat (Permanently fixed in view) */}
                <aside className="lg:col-span-4 xl:col-span-3 h-full min-h-0 flex flex-col">
                  <ChatPanel />
                </aside>
              </div>
            ) : (
              /* ── Mobile View (Clean Tabbed Experience) ── */
              <div className="flex flex-col h-full min-h-0 w-full overflow-hidden pb-16">
                {/* Video Tab Panel (Kept permanently mounted to preserve playback & audio) */}
                <div className={`flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar gap-3 p-1 ${mobileActiveTab === 'video' ? 'flex' : 'hidden'}`}>
                  <VideoPlayer
                    videoUrl={currentVideo?.videoUrl || currentVideo?.youtubeId}
                    onPlaybackChange={(pData) => actions.syncPlayback(pData)}
                    onVideoEnded={handleVideoEnded}
                  />
                  <div className="flex-1 min-h-[360px] flex flex-col">
                    <SearchAndQueuePanel
                      onAddVideo={(video) => actions.addToQueue(video)}
                      onPlayVideo={(video) => actions.syncPlayback({ youtubeId: video.youtubeId, title: video.title, isPlaying: true, currentTime: 0 })}
                      onRemoveVideo={(queueId) => actions.removeFromQueue(queueId)}
                    />
                  </div>
                </div>

                {/* Chat Tab Panel */}
                <div className={`flex-1 min-h-0 h-full flex flex-col p-1 ${mobileActiveTab === 'chat' ? 'flex' : 'hidden'}`}>
                  <ChatPanel />
                </div>

                {/* Members Tab Panel */}
                <div className={`flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar gap-3 p-1 pb-20 ${mobileActiveTab === 'members' ? 'flex' : 'hidden'}`}>
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

                <MobileTabBar
                  activeTab={mobileActiveTab}
                  onSelectTab={setMobileActiveTab}
                  memberCount={members.length}
                  chatCount={chatHistoryLength}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
