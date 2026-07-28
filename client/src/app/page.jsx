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
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Page() {
  const {
    socket,
    isConnected,
    roomState,
    toastNotification,
    setToastNotification,
    controlRequestNotice,
    setControlRequestNotice,
    incomingReaction,
    syncedPlaybackEvent,
    createRoom,
    joinRoom,
    syncPlayback,
    requestControl,
    respondControlRequest,
    revokeControl,
    sendChatMessage,
    sendReaction
  } = useSocket();

  const [initialRoomId, setInitialRoomId] = useState('');
  const [mobileActiveTab, setMobileActiveTab] = useState('video');
  const [isMobileScreen, setIsMobileScreen] = useState(false); // Default to false for SSR, update in useEffect

  // Responsive Window Listener
  useEffect(() => {
    setIsMobileScreen(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-join room on reload if URL parameters exist and nickname is saved
  useEffect(() => {
    if (!isConnected) return; // Wait until socket connects

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const savedNickname = localStorage.getItem('tg_nickname');
      if (savedNickname && !roomState) {
        // Auto-join
        handleJoinRoom(roomParam.toUpperCase(), savedNickname);
      } else if (!roomState) {
        // Just set the input field for them to manually enter nickname
        setInitialRoomId(roomParam.toUpperCase());
      }
    }
  }, [isConnected]); // Run when socket connects

  // Update browser URL query string when room state changes
  useEffect(() => {
    if (roomState?.roomId) {
      const newUrl = `${window.location.pathname}?room=${roomState.roomId}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [roomState?.roomId]);

  const handleCreateRoom = async (nickname) => {
    try {
      await createRoom(nickname);
    } catch (err) {
      alert('Failed to create room: ' + err);
    }
  };

  const handleJoinRoom = async (roomId, nickname) => {
    try {
      await joinRoom(roomId, nickname);
    } catch (err) {
      alert('Failed to join room: ' + err);
    }
  };

  const handleLeaveRoom = () => {
    window.location.href = window.location.pathname;
  };

  const currentMember = roomState?.members?.find((m) => m.socketId === socket?.id);
  const isHost = currentMember?.isHost || false;
  const hasControl = currentMember?.hasControl || false;

  return (
    <main className="app-viewport">
      {/* Toast Notification */}
      {toastNotification && (
        <div 
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            left: isMobileScreen ? '16px' : 'auto',
            zIndex: 100
          }}
        >
          <div 
            className="panel"
            style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              border: toastNotification.type === 'error' ? '1px solid #ef4444' : '1px solid var(--accent-primary)',
              background: 'rgba(13, 16, 23, 0.9)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {toastNotification.type === 'error' ? (
                <AlertCircle size={16} color="#ef4444" />
              ) : (
                <CheckCircle2 size={16} color="var(--accent-primary)" />
              )}
              <span style={{ fontSize: '0.82rem' }}>{toastNotification.message}</span>
            </div>
            <button 
              onClick={() => setToastNotification(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '6px' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {!roomState ? (
        /* Join / Create Landing Page */
        <JoinRoomModal 
          initialRoomId={initialRoomId}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      ) : (
        /* Main Co-Watching Room View */
        <div className="room-container" style={{ maxWidth: '1360px', margin: '0 auto', padding: isMobileScreen ? '10px' : '16px 20px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <header>
            <RoomHeader 
              roomId={roomState.roomId}
              memberCount={roomState.members.length}
              isHost={isHost}
              onLeaveRoom={handleLeaveRoom}
            />
          </header>

          {!isMobileScreen ? (
            /* Desktop / Tablet Grid View */
            <div className="desktop-grid">
              {/* Left Column: Player, Video Details Hub & Queue */}
              <section className="left-column">
                <YouTubePlayer 
                  youtubeId={roomState.currentVideo?.youtubeId}
                  playback={roomState.playback}
                  isHost={isHost}
                  hasControl={hasControl}
                  syncedPlaybackEvent={syncedPlaybackEvent}
                  onPlaybackChange={(pData) => syncPlayback(pData)}
                  onRequestControl={requestControl}
                />

                <div className="left-scrollable scroll-y">
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
              </section>

              {/* Right Column: Live Chat Panel */}
              <aside className="chat-sidebar">
                <ChatPanel 
                  chatHistory={roomState.chatHistory}
                  currentSocketId={socket?.id}
                  incomingReaction={incomingReaction}
                  onSendMessage={sendChatMessage}
                  onSendReaction={sendReaction}
                />
              </aside>
            </div>
          ) : (
            /* Mobile View (< 768px) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Top Sticky Video Player */}
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

              {/* Mobile Active Tab View */}
              {mobileActiveTab === 'video' && (
                <div style={{ paddingBottom: '70px' }}>
                  <VideoDetailsCard 
                    currentVideo={roomState.currentVideo}
                    roomState={roomState}
                    currentSocketId={socket?.id}
                    isHost={isHost}
                    hasControl={hasControl}
                    onRequestControl={requestControl}
                  />
                </div>
              )}

              {mobileActiveTab === 'chat' && (
                <div style={{ height: 'calc(100dvh - 280px)' }}>
                  <ChatPanel 
                    chatHistory={roomState.chatHistory}
                    currentSocketId={socket?.id}
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

              {/* Mobile Bottom Navigation */}
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
    </main>
  );
}
