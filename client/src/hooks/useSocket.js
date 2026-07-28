import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

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
// We use sessionStorage so the session survives page reloads
// but is cleared when the tab is closed (correct UX).
const SESSION_KEY = 'tg_session';

function saveSession(roomId, nickname) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, nickname, savedAt: Date.now() }));
  } catch (_) {}
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire after 2 hours to avoid stale sessions
    if (Date.now() - data.savedAt > 7200000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
}
// -------------------------------------------------

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);
  const [controlRequestNotice, setControlRequestNotice] = useState(null);
  const [incomingReaction, setIncomingReaction] = useState(null);
  const [syncedPlaybackEvent, setSyncedPlaybackEvent] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

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
      setIsConnected(true);
      setIsReconnecting(false);

      // Auto-rejoin if we have a saved session and aren't in a room yet
      const session = activeSessionRef.current || loadSession();
      if (session && !roomState) {
        console.log('🔄 Auto-rejoining room:', session.roomId);
        attemptRejoin(socket, session.roomId, session.nickname);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket Disconnected:', reason);
      setIsConnected(false);
      // Only show reconnecting if it was an unexpected disconnect
      if (reason !== 'io client disconnect') {
        setIsReconnecting(true);
      }
    });

    socket.on('reconnecting', () => {
      setIsReconnecting(true);
    });

    socket.on('room_state_updated', (newRoomState) => {
      setRoomState(newRoomState);
    });

    socket.on('playback_synced', (data) => {
      setSyncedPlaybackEvent(data);
    });

    socket.on('control_request_received', (requestData) => {
      setControlRequestNotice(requestData);
    });

    socket.on('control_status_changed', ({ hasControl, message }) => {
      setToastNotification({ type: hasControl ? 'success' : 'warning', message });
    });

    socket.on('toast_notification', (data) => {
      setToastNotification(data);
    });

    socket.on('reaction_triggered', (reaction) => {
      setIncomingReaction(reaction);
    });

    socket.on('error_message', ({ message }) => {
      setToastNotification({ type: 'error', message });
    });

    socket.on('session_ended', () => {
      clearSession();
      activeSessionRef.current = null;
      setSessionEnded(true);
      setRoomState(null);
      setIsReconnecting(false);
    });

    socket.on('chat_received', (message) => {
      setRoomState(prev => {
        if (!prev) return prev;
        const alreadyExists = prev.chatHistory.some(m => m.id === message.id);
        if (alreadyExists) return prev;
        return { ...prev, chatHistory: [...prev.chatHistory, message] };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Attempt rejoin with retry logic (handles Render cold-start)
  const attemptRejoin = (socket, roomId, nickname, retriesLeft = 4) => {
    socket.emit('join_room', { roomId, nickname }, (response) => {
      if (response.success) {
        setRoomState(response.roomState);
        activeSessionRef.current = { roomId, nickname };
        saveSession(roomId, nickname);
        setIsReconnecting(false);
      } else if (response.error === 'Room not found' && retriesLeft > 0) {
        // Server may be cold-starting — retry
        setTimeout(() => attemptRejoin(socket, roomId, nickname, retriesLeft - 1), 2000);
      } else {
        // Truly not found — clear session and let user re-enter
        clearSession();
        activeSessionRef.current = null;
        setIsReconnecting(false);
        setRoomState(null);
      }
    });
  };

  const createRoom = useCallback((nickname) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject('Socket not connected');
      socketRef.current.emit('create_room', { nickname }, (response) => {
        if (response.success) {
          setRoomState(response.roomState);
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
            setRoomState(response.roomState);
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
      setRoomState(null);

      if (!socketRef.current) { resolve(); return; }

      socketRef.current.emit('leave_room', () => {
        resolve();
      });
    });
  }, []);

  const syncPlayback = useCallback((playbackData) => {
    if (socketRef.current) {
      socketRef.current.emit('sync_playback', playbackData);
    }
  }, []);

  const requestControl = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('request_control');
    }
  }, []);

  const respondControlRequest = useCallback((targetSocketId, approved) => {
    if (socketRef.current) {
      socketRef.current.emit('respond_control_request', { targetSocketId, approved });
      setControlRequestNotice(null);
    }
  }, []);

  const revokeControl = useCallback((targetSocketId) => {
    if (socketRef.current) {
      socketRef.current.emit('revoke_control', { targetSocketId });
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
  };
}
