import { RoomManager } from './roomManager.js';
import xss from 'xss';
import jwt from 'jsonwebtoken';

const rateLimits = new Map();
// socketId -> { roomId, data, timer } — newest sync payload awaiting a retry
const pendingSyncs = new Map();

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
  return xss(str.trim().substring(0, maxLen));
};

export function setupSocketHandlers(io) {
  // A07: Authentication - Verify Supabase JWT token before allowing connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow guest connections, but flag them as unauthenticated if we want strict mode.
      // For this app, we allow guests to join, but they can't spoof a real user's ID.
      socket.user = null;
      return next();
    }

    try {
      // Supabase JWTs are signed with the JWT Secret
      if (process.env.SUPABASE_JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
        socket.user = decoded; // Contains sub (userId), email, etc.
      }
      return next();
    } catch (err) {
      console.warn('Socket authentication failed:', err.message);
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    let currentRoomId = null;

    // Helper to send formatted room state
    const broadcastRoomState = (roomId) => {
      const room = RoomManager.getRoom(roomId);
      if (room) {
        io.to(roomId).emit('room_state_updated', RoomManager.getRoomStateDTO(room));
      }
    };

    // Process a playback sync (play/pause/seek/load video). Shared by the
    // immediate path and the retried (rate-limited) path so behavior is identical.
    const processSyncPlayback = (socket, roomId, data) => {
      // When loading a new video, force isPlaying:true so it auto-plays for everyone
      const enrichedData = { ...data };
      if (data.youtubeId) {
        enrichedData.isPlaying = true;
        enrichedData.currentTime = 0;
      }

      const result = RoomManager.updatePlayback(roomId, socket.id, enrichedData);
      if (result && result.error) {
        socket.emit('error_message', { message: result.error });
        return;
      }

      if (result && result.room) {
        if (data.youtubeId) {
          // Video changed: broadcast full state to ALL users immediately
          io.to(roomId).emit('room_state_updated', RoomManager.getRoomStateDTO(result.room));
        } else {
          // Regular play/pause/seek: lightweight sync to peers only (no full state broadcast)
          socket.to(roomId).emit('playback_synced', {
            playback: result.room.playback,
            currentVideo: result.room.currentVideo,
            senderId: socket.id
          });
        }
      }
    };

    // If a sync arrives inside the rate-limit window, DON'T drop it — a dropped
    // pause would leave other members playing indefinitely. Keep the newest
    // payload (last-write-wins) and apply it right after the window closes.
    const scheduleSyncPlayback = (socket, roomId, data) => {
      const existing = pendingSyncs.get(socket.id);
      if (existing) clearTimeout(existing.timer);

      const timer = setTimeout(() => {
        pendingSyncs.delete(socket.id);
        // Only apply if the socket is still connected and still in this room
        if (socket.connected && currentRoomId === roomId) {
          processSyncPlayback(socket, roomId, data);
        }
      }, 100);

      pendingSyncs.set(socket.id, { roomId, data, timer });
    };

    // 1. Create Room
    socket.on('create_room', ({ userId, nickname, avatar, roomName, mood }, callback) => {
      const cleanName = sanitizeStr(nickname, 20);
      if (!cleanName) {
        if (typeof callback === 'function') callback({ success: false, error: 'Nickname is required.' });
        return;
      }
      
      if (!checkRateLimit(socket.id, 'create', 5000)) {
        if (typeof callback === 'function') callback({ success: false, error: 'You are doing that too fast.' });
        return;
      }

      // If a real user token is present, strictly enforce that they use their real userId
      const finalUserId = socket.user?.sub ? socket.user.sub : userId;

      const room = RoomManager.createRoom(finalUserId, socket.id, cleanName, avatar, roomName, mood);
      room._io = io; // Store io ref so async grace-period timer can emit events
      currentRoomId = room.roomId;
      socket.join(room.roomId);

      if (typeof callback === 'function') {
        callback({ success: true, roomState: RoomManager.getRoomStateDTO(room) });
      }

      broadcastRoomState(room.roomId);
    });

    // 2. Join Room (handles both fresh joins and seamless reconnects)
    // Uses async ensureRoom to hydrate room from Redis if not in memory.
    socket.on('join_room', async ({ roomId, userId, nickname, avatar }, callback) => {
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

      // If authenticated, enforce real userId
      const finalUserId = socket.user?.sub ? socket.user.sub : userId;

      // Try memory first; if not found, attempt to load from Redis
      const roomExists = RoomManager.getRoom(cleanRoomId);
      if (!roomExists) {
        const loaded = await RoomManager.ensureRoom(cleanRoomId);
        if (!loaded) {
          if (typeof callback === 'function') callback({ success: false, error: 'Room not found. It may have expired.' });
          return;
        }
      }

      const result = RoomManager.joinRoom(cleanRoomId, finalUserId, socket.id, cleanName, avatar);

      if (result.error) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        return;
      }

      const { room, wasReconnect } = result;
      room._io = io; // Ensure io ref is always fresh
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
      if (!data || typeof data !== 'object') return;

      if (checkRateLimit(socket.id, 'sync', 100)) {
        processSyncPlayback(socket, currentRoomId, data);
      } else {
        scheduleSyncPlayback(socket, currentRoomId, data);
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

    const handleAction = (actionName, rateLimitMs, managerFunc, extractArgs = (d) => [d]) => {
      return (data) => {
        if (!currentRoomId) return;
        if (actionName && !checkRateLimit(socket.id, actionName, rateLimitMs)) return;

        const args = data !== undefined ? extractArgs(data) : [];
        const result = managerFunc(currentRoomId, socket.id, ...args);
        
        if (result && result.error) {
          socket.emit('error_message', { message: result.error });
          return;
        }
        if (result && result.room) {
          broadcastRoomState(currentRoomId);
        }
      };
    };

    // 6. Queue Controls
    socket.on('add_to_queue', handleAction('queue', 1000, RoomManager.addToQueue.bind(RoomManager)));
    socket.on('remove_from_queue', handleAction('queue', 1000, RoomManager.removeFromQueue.bind(RoomManager), d => [d.queueId]));
    socket.on('play_next', handleAction('queue', 1000, RoomManager.playNext.bind(RoomManager), () => []));
    socket.on('update_room_settings', handleAction(null, 0, RoomManager.updateRoomSettings.bind(RoomManager)));



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

    socket.on('transfer_host', handleAction(null, 0, RoomManager.transferHost, d => [d.newHostId]));

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

      // Cleanup any queued (rate-limited) playback sync for this socket
      const pending = pendingSyncs.get(socket.id);
      if (pending) {
        clearTimeout(pending.timer);
        pendingSyncs.delete(socket.id);
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
