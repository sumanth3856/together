import { useEffect, useCallback } from 'react';
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
const SESSION_KEY = 'tg_session';

function saveSession(roomId, userId, nickname, avatar) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, userId, nickname, avatar, savedAt: Date.now() }));
  } catch (_) {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
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

let globalSocket = null;
let activeSessionObj = null;

// Attempt rejoin with retry logic
const attemptRejoin = (socket, roomId, userId, nickname, avatar, retriesLeft = 4) => {
  socket.emit('join_room', { roomId, userId, nickname, avatar }, (response) => {
    if (response.success) {
      useRoomStore.getState().setRoomState(response.roomState);
      activeSessionObj = { roomId, userId, nickname, avatar };
      saveSession(roomId, userId, nickname, avatar);
      useRoomStore.getState().setIsReconnecting(false);
    } else if (response.error === 'Room not found' && retriesLeft > 0) {
      setTimeout(() => attemptRejoin(socket, roomId, userId, nickname, avatar, retriesLeft - 1), 2000);
    } else {
      clearSession();
      activeSessionObj = null;
      useRoomStore.getState().setIsReconnecting(false);
      useRoomStore.getState().setRoomState(null);
    }
  });
};

export function useSocket() {
  useEffect(() => {
    if (!globalSocket && typeof window !== 'undefined') {
      const socket = io(getSocketUrl(), {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      globalSocket = socket;

      socket.on('connect', () => {
        console.log('⚡ Socket Connected:', socket.id);
        useRoomStore.getState().setSocketId(socket.id);
        useRoomStore.getState().setIsConnected(true);

        const session = activeSessionObj || loadSession();
        const currentRoomState = useRoomStore.getState().roomState;
        if (session && !currentRoomState) {
          console.log('🔄 Auto-rejoining room:', session.roomId);
          useRoomStore.getState().setIsReconnecting(true);
          attemptRejoin(socket, session.roomId, session.userId, session.nickname, session.avatar);
        } else {
          useRoomStore.getState().setIsReconnecting(false);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket Disconnected:', reason);
        useRoomStore.getState().setIsConnected(false);
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
        activeSessionObj = null;
        useRoomStore.getState().setSessionEnded(true);
        useRoomStore.getState().setRoomState(null);
        useRoomStore.getState().setIsReconnecting(false);
      });

      socket.on('kicked_from_room', () => {
        clearSession();
        activeSessionObj = null;
        useRoomStore.getState().setSessionEnded(true);
        useRoomStore.getState().setRoomState(null);
        useRoomStore.getState().setIsReconnecting(false);
        useUIStore.getState().setToastNotification({ type: 'error', message: 'You have been kicked from the room.' });
      });

      socket.on('chat_received', (message) => {
        useRoomStore.getState().updateChatHistory(message);
      });
    }
  }, []);

  const createRoom = useCallback((userId, nickname, avatar) => {
    return new Promise((resolve, reject) => {
      if (!globalSocket) return reject('Socket not connected');
      globalSocket.emit('create_room', { userId, nickname, avatar }, (response) => {
        if (response.success) {
          useRoomStore.getState().setRoomState(response.roomState);
          const roomId = response.roomState.roomId;
          activeSessionObj = { roomId, userId, nickname, avatar };
          saveSession(roomId, userId, nickname, avatar);
          resolve(response.roomState);
        } else {
          reject(response.error);
        }
      });
    });
  }, []);

  const joinRoom = useCallback((roomId, userId, nickname, avatar) => {
    return new Promise((resolve, reject) => {
      if (!globalSocket) return reject('Socket not connected');
      const attempt = (retriesLeft) => {
        globalSocket.emit('join_room', { roomId, userId, nickname, avatar }, (response) => {
          if (response.success) {
            useRoomStore.getState().setRoomState(response.roomState);
            activeSessionObj = { roomId, userId, nickname, avatar };
            saveSession(roomId, userId, nickname, avatar);
            resolve(response.roomState);
          } else if (response.error === 'Room not found' && retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), 2000);
          } else {
            reject(response.error);
          }
        });
      };
      attempt(3);
    });
  }, []);

  const leaveRoom = useCallback(() => {
    return new Promise((resolve) => {
      clearSession();
      activeSessionObj = null;
      useRoomStore.getState().setRoomState(null);

      if (!globalSocket) { resolve(); return; }

      globalSocket.emit('leave_room', () => {
        resolve();
      });
    });
  }, []);

  const syncPlayback = useCallback((playbackData) => {
    if (globalSocket) {
      globalSocket.emit('sync_playback', playbackData);
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
    if (globalSocket) globalSocket.emit('send_chat', { text });
  }, []);

  const sendReaction = useCallback((emoji) => {
    if (globalSocket) globalSocket.emit('send_reaction', { emoji });
  }, []);

  const addToQueue = useCallback((video) => {
    if (globalSocket) globalSocket.emit('add_to_queue', video);
  }, []);

  const removeFromQueue = useCallback((queueId) => {
    if (globalSocket) globalSocket.emit('remove_from_queue', { queueId });
  }, []);

  const playNext = useCallback(() => {
    if (globalSocket) globalSocket.emit('play_next');
  }, []);

  const kickUser = useCallback((targetUserId) => {
    if (globalSocket) globalSocket.emit('kick_user', { targetUserId });
  }, []);

  const transferHost = useCallback((newHostId) => {
    if (globalSocket) globalSocket.emit('transfer_host', { newHostId });
  }, []);

  const updateRoomSettings = useCallback((newSettings) => {
    if (globalSocket) globalSocket.emit('update_room_settings', newSettings);
  }, []);

  return {
    socket: globalSocket,
    createRoom,
    joinRoom,
    leaveRoom,
    syncPlayback,
    sendChatMessage,
    sendReaction,
    addToQueue,
    removeFromQueue,
    playNext,
    kickUser,
    transferHost,
    updateRoomSettings
  };
}
