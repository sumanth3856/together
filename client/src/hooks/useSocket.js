import { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useRoomStore } from '../store/useRoomStore';
import { useUIStore } from '../store/useUIStore';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
  }
  if (typeof window === 'undefined') return '';

  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:4000`;
  }
  return '';
};

// ---------- Session Persistence Helpers ----------
// localStorage survives hard reloads AND tab closes — intentional for this app.
// Sessions expire after 24 hours or on explicit leave.
const SESSION_KEY = 'tg_session';

function saveSession(roomId, nickname) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, nickname, savedAt: Date.now() }));
  } catch (_) {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire after 24 hours to avoid stale sessions
    if (Date.now() - data.savedAt > 86400000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
}
// -------------------------------------------------

export function useSocket() {
  const socketRef = useRef(null);
  
  // Track the active session locally so reconnect logic can access it
  const activeSessionRef = useRef(null);

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket Connected:', socket.id);
      useRoomStore.getState().setSocketId(socket.id);
      useRoomStore.getState().setIsConnected(true);
      useRoomStore.getState().setIsReconnecting(false);

      // Auto-rejoin if we have a saved session and aren't in a room yet
      const session = activeSessionRef.current || loadSession();
      const currentRoomState = useRoomStore.getState().roomState;
      if (session && !currentRoomState) {
        console.log('🔄 Auto-rejoining room:', session.roomId);
        attemptRejoin(socket, session.roomId, session.nickname);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket Disconnected:', reason);
      useRoomStore.getState().setIsConnected(false);
      // Only show reconnecting if it was an unexpected disconnect
      if (reason !== 'io client disconnect') {
        useRoomStore.getState().setIsReconnecting(true);
      }
    });

    socket.on('reconnecting', () => {
      useRoomStore.getState().setIsReconnecting(true);
    });

    socket.on('room_state_updated', (newRoomState) => {
      useRoomStore.getState().setRoomState(newRoomState);
    });

    socket.on('playback_synced', (data) => {
      useRoomStore.getState().setSyncedPlaybackEvent(data);
    });



    socket.on('toast_notification', (data) => {
      useUIStore.getState().setToastNotification(data);
    });

    socket.on('reaction_triggered', (reaction) => {
      useUIStore.getState().setIncomingReaction(reaction);
    });

    socket.on('error_message', ({ message }) => {
      useUIStore.getState().setToastNotification({ type: 'error', message });
    });

    socket.on('session_ended', () => {
      clearSession();
      activeSessionRef.current = null;
      useRoomStore.getState().setSessionEnded(true);
      useRoomStore.getState().setRoomState(null);
      useRoomStore.getState().setIsReconnecting(false);
    });

    socket.on('chat_received', (message) => {
      useRoomStore.getState().updateChatHistory(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Attempt rejoin with retry logic (handles Render cold-start)
  const attemptRejoin = (socket, roomId, nickname, retriesLeft = 4) => {
    socket.emit('join_room', { roomId, nickname }, (response) => {
      if (response.success) {
        useRoomStore.getState().setRoomState(response.roomState);
        activeSessionRef.current = { roomId, nickname };
        saveSession(roomId, nickname);
        useRoomStore.getState().setIsReconnecting(false);
      } else if (response.error === 'Room not found' && retriesLeft > 0) {
        // Server may be cold-starting — retry
        setTimeout(() => attemptRejoin(socket, roomId, nickname, retriesLeft - 1), 2000);
      } else {
        // Truly not found — clear session and let user re-enter
        clearSession();
        activeSessionRef.current = null;
        useRoomStore.getState().setIsReconnecting(false);
        useRoomStore.getState().setRoomState(null);
      }
    });
  };

  const createRoom = useCallback((nickname) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject('Socket not connected');
      socketRef.current.emit('create_room', { nickname }, (response) => {
        if (response.success) {
          useRoomStore.getState().setRoomState(response.roomState);
          const roomId = response.roomState.roomId;
          activeSessionRef.current = { roomId, nickname };
          saveSession(roomId, nickname);
          resolve(response.roomState);
        } else {
          reject(response.error);
        }
      });
    });
  }, []);

  const joinRoom = useCallback((roomId, nickname) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject('Socket not connected');

      const attempt = (retriesLeft) => {
        socketRef.current.emit('join_room', { roomId, nickname }, (response) => {
          if (response.success) {
            useRoomStore.getState().setRoomState(response.roomState);
            activeSessionRef.current = { roomId, nickname };
            saveSession(roomId, nickname);
            resolve(response.roomState);
          } else if (response.error === 'Room not found' && retriesLeft > 0) {
            // Render free tier cold-start — retry silently
            setTimeout(() => attempt(retriesLeft - 1), 2000);
          } else {
            reject(response.error);
          }
        });
      };

      attempt(3);
    });
  }, []);

  // Intentional leave — triggers server-side disbanding for host
  const leaveRoom = useCallback(() => {
    return new Promise((resolve) => {
      clearSession();
      activeSessionRef.current = null;
      useRoomStore.getState().setRoomState(null);

      if (!socketRef.current) { resolve(); return; }

      socketRef.current.emit('leave_room', () => {
        resolve();
      });
    });
  }, []);

  const syncPlayback = useCallback((playbackData) => {
    if (socketRef.current) {
      socketRef.current.emit('sync_playback', playbackData);

      // Optimistically update local roomState so the sender immediately sees their own action (e.g. Live/Paused badge)
      const currentState = useRoomStore.getState().roomState;
      if (currentState) {
        useRoomStore.getState().setRoomState({
          ...currentState,
          playback: {
            ...currentState.playback,
            ...playbackData,
            updatedAt: Date.now()
          }
        });
      }
    }
  }, []);



  const sendChatMessage = useCallback((text) => {
    if (socketRef.current) {
      socketRef.current.emit('send_chat', { text });
    }
  }, []);

  const sendReaction = useCallback((emoji) => {
    if (socketRef.current) {
      socketRef.current.emit('send_reaction', { emoji });
    }
  }, []);

  return {
    socket: socketRef.current,
    createRoom,
    joinRoom,
    leaveRoom,
    syncPlayback,
    sendChatMessage,
    sendReaction
  };
}
