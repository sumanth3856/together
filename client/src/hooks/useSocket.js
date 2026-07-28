import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_SERVER_URL) {
    return import.meta.env.VITE_SOCKET_SERVER_URL;
  }
  const { protocol, hostname, port } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:4000`;
  }
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
};

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);
  const [controlRequestNotice, setControlRequestNotice] = useState(null);
  const [incomingReaction, setIncomingReaction] = useState(null);
  const [syncedPlaybackEvent, setSyncedPlaybackEvent] = useState(null);

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      transports: ['polling', 'websocket'], // Smooth upgrade from polling to websocket
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket Disconnected');
      setIsConnected(false);
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

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((nickname) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject('Socket not connected');
      socketRef.current.emit('create_room', { nickname }, (response) => {
        if (response.success) {
          setRoomState(response.roomState);
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
      socketRef.current.emit('join_room', { roomId, nickname }, (response) => {
        if (response.success) {
          setRoomState(response.roomState);
          resolve(response.roomState);
        } else {
          reject(response.error);
        }
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
  };
}
