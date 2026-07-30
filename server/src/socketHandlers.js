import { RoomManager } from './roomManager.js';

const rateLimits = new Map();

const checkRateLimit = (socketId, action, limitMs) => {
  const key = `${socketId}:${action}`;
  const now = Date.now();
  const lastAction = rateLimits.get(key) || 0;
  if (now - lastAction < limitMs) return false; // Rate limited
  rateLimits.set(key, now);
  return true;
};

const sanitizeStr = (str, maxLen = 50) => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLen);
};

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentRoomId = null;

    // Helper to send formatted room state
    const broadcastRoomState = (roomId) => {
      const room = RoomManager.getRoom(roomId);
      if (room) {
        io.to(roomId).emit('room_state_updated', RoomManager.getRoomStateDTO(room));
      }
    };

    // 1. Create Room
    socket.on('create_room', ({ userId, nickname, avatar }, callback) => {
      const cleanName = sanitizeStr(nickname, 20);
      if (!cleanName) {
        if (typeof callback === 'function') callback({ success: false, error: 'Nickname is required.' });
        return;
      }
      
      if (!checkRateLimit(socket.id, 'create', 5000)) {
        if (typeof callback === 'function') callback({ success: false, error: 'You are doing that too fast.' });
        return;
      }

      const room = RoomManager.createRoom(userId, socket.id, cleanName, avatar);
      currentRoomId = room.roomId;
      socket.join(room.roomId);

      if (typeof callback === 'function') {
        callback({ success: true, roomState: RoomManager.getRoomStateDTO(room) });
      }

      broadcastRoomState(room.roomId);
    });

    // 2. Join Room (handles both fresh joins and seamless reconnects)
    socket.on('join_room', ({ roomId, userId, nickname, avatar }, callback) => {
      const cleanRoomId = sanitizeStr(roomId, 10).toUpperCase();
      const cleanName = sanitizeStr(nickname, 20);

      if (!cleanRoomId || !cleanName) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room ID and Nickname required.' });
        return;
      }

      if (!checkRateLimit(socket.id, 'join', 1000)) {
        if (typeof callback === 'function') callback({ success: false, error: 'Too many join attempts.' });
        return;
      }

      const result = RoomManager.joinRoom(cleanRoomId, userId, socket.id, cleanName, avatar);

      if (result.error) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        return;
      }

      const { room, wasReconnect } = result;
      currentRoomId = room.roomId;
      socket.join(room.roomId);

      if (typeof callback === 'function') {
        callback({ success: true, roomState: RoomManager.getRoomStateDTO(room), wasReconnect });
      }

      broadcastRoomState(room.roomId);
    });

    // 3. Intentional Leave (explicit "Leave Room" button click)
    socket.on('leave_room', (callback) => {
      if (!currentRoomId) {
        if (typeof callback === 'function') callback({ success: true });
        return;
      }

      const result = RoomManager.intentionalLeave(socket.id);
      socket.leave(currentRoomId);
      const roomIdSnapshot = currentRoomId;
      currentRoomId = null;

      if (result) {
        if (result.sessionEnded) {
          // Host intentionally left — disband for everyone
          io.to(roomIdSnapshot).emit('session_ended');
        } else if (result.room) {
          broadcastRoomState(roomIdSnapshot);
        }
      }

      if (typeof callback === 'function') callback({ success: true });
    });

    // 4. Playback Synchronization (Play, Pause, Seek, Load Video)
    socket.on('sync_playback', (data) => {
      if (!currentRoomId) return;

      if (!checkRateLimit(socket.id, 'sync', 100)) return; // Allow 10 syncs per second max

      // When loading a new video, force isPlaying:true so it auto-plays for everyone
      const enrichedData = { ...data };
      if (data.youtubeId) {
        enrichedData.isPlaying = true;
        enrichedData.currentTime = 0;
      }

      const result = RoomManager.updatePlayback(currentRoomId, socket.id, enrichedData);
      if (result && result.error) {
        socket.emit('error_message', { message: result.error });
        return;
      }

      if (result && result.room) {
        if (data.youtubeId) {
          // Video changed: broadcast full state to ALL users immediately
          io.to(currentRoomId).emit('room_state_updated', RoomManager.getRoomStateDTO(result.room));
        } else {
          // Regular play/pause/seek: lightweight sync to peers only (no full state broadcast)
          socket.to(currentRoomId).emit('playback_synced', {
            playback: result.room.playback,
            currentVideo: result.room.currentVideo,
            senderId: socket.id
          });
        }
      }
    });

    // 5. Live Text Chat
    socket.on('send_chat', ({ text }) => {
      const cleanText = sanitizeStr(text, 500);
      if (!currentRoomId || !cleanText) return;

      if (!checkRateLimit(socket.id, 'chat', 500)) {
        socket.emit('toast_notification', { type: 'warning', message: 'You are typing too fast!' });
        return;
      }

      const result = RoomManager.addChatMessage(currentRoomId, socket.id, cleanText);
      if (result && result.message) {
        io.to(currentRoomId).emit('chat_received', result.message);
      }
    });

    // 6. Queue Controls
    socket.on('add_to_queue', (video) => {
      if (!currentRoomId) return;
      if (!checkRateLimit(socket.id, 'queue', 1000)) return;

      const result = RoomManager.addToQueue(currentRoomId, socket.id, video);
      if (result && result.room) {
        broadcastRoomState(currentRoomId);
      }
    });

    socket.on('remove_from_queue', ({ queueId }) => {
      if (!currentRoomId) return;
      if (!checkRateLimit(socket.id, 'queue', 1000)) return;

      const result = RoomManager.removeFromQueue(currentRoomId, socket.id, queueId);
      if (result && result.error) {
        socket.emit('error_message', { message: result.error });
        return;
      }
      if (result && result.room) {
        broadcastRoomState(currentRoomId);
      }
    });

    socket.on('play_next', () => {
      if (!currentRoomId) return;
      if (!checkRateLimit(socket.id, 'queue', 1000)) return;

      const result = RoomManager.playNext(currentRoomId, socket.id);
      if (result && result.room) {
        broadcastRoomState(currentRoomId);
      }
    });

    // 7. Advanced Host Controls
    socket.on('kick_user', ({ targetUserId }) => {
      if (!currentRoomId) return;

      const result = RoomManager.kickUser(currentRoomId, socket.id, targetUserId);
      if (result && result.error) {
        socket.emit('error_message', { message: result.error });
        return;
      }
      if (result && result.kickedSocketIds) {
        result.kickedSocketIds.forEach(id => {
          io.to(id).emit('kicked_from_room');
          const kickedSocket = io.sockets.sockets.get(id);
          if (kickedSocket) kickedSocket.leave(currentRoomId);
        });
        broadcastRoomState(currentRoomId);
      }
    });

    socket.on('transfer_host', ({ newHostId }) => {
      if (!currentRoomId) return;

      const result = RoomManager.transferHost(currentRoomId, socket.id, newHostId);
      if (result && result.error) {
        socket.emit('error_message', { message: result.error });
        return;
      }
      if (result && result.room) {
        broadcastRoomState(currentRoomId);
      }
    });

    // 8. Floating Emoji Reaction Bursts
    socket.on('send_reaction', ({ emoji }) => {
      const cleanEmoji = sanitizeStr(emoji, 10);
      if (!currentRoomId || !cleanEmoji) return;

      if (!checkRateLimit(socket.id, 'reaction', 300)) return; // Prevents extreme emoji spam

      const room = RoomManager.getRoom(currentRoomId);
      const member = RoomManager.getMemberBySocketId(room, socket.id);

      io.to(currentRoomId).emit('reaction_triggered', {
        id: `react-${Date.now()}-${Math.random()}`,
        emoji,
        senderName: member?.nickname || 'Guest',
        senderColor: '#FF5733',
        xPos: Math.floor(15 + Math.random() * 70)
      });
    });

    // 10. Socket Disconnect (accidental — could be a reload)
    socket.on('disconnect', () => {
      // Cleanup rate limits to prevent memory leaks
      for (const key of rateLimits.keys()) {
        if (key.startsWith(`${socket.id}:`)) rateLimits.delete(key);
      }

      if (currentRoomId) {
        // Use grace-period leaveRoom (does NOT immediately disband)
        const result = RoomManager.leaveRoom(socket.id);
        if (result && result.room) {
          // Only broadcast updated state to remaining members
          // (do NOT send session_ended — they may reconnect)
          broadcastRoomState(result.roomId);
        }
      }
    });
  });
}
