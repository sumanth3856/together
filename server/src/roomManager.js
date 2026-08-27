/**
 * roomManager.js
 *
 * In-memory room store backed by Upstash Redis for persistence.
 *
 * Architecture — Hybrid Write-Through Cache:
 *  • All reads/writes hit the in-memory Map first (zero latency for real-time sync).
 *  • After every mutation, the room is asynchronously persisted to Redis (fire-and-forget
 *    with error logging — never blocks the socket response).
 *  • On a cache-miss (room not in memory), we check Redis before returning "not found".
 *    This lets rooms survive server restarts, cold starts, and Render/Fly.io sleeps.
 *
 * Room Lifetime:
 *  • Rooms persist in Redis for 7 days of inactivity (sliding TTL).
 *  • The TTL refreshes on every save (join, chat, playback change, etc.).
 *  • Rooms are only fully deleted from Redis when explicitly disbanded
 *    (future: host presses "End Session") or when TTL expires.
 *  • When all members leave, the room stays in Redis so users can rejoin later.
 */

import redis from './redisClient.js';

const ROOM_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
// Namespace prefix — keeps Together keys separate from other projects in the same DB
const ROOM_KEY = (id) => `together:room:${id}`;

// ─── In-Memory Cache ─────────────────────────────────────────────────────────
export const rooms = new Map();

// ─── Serialization ────────────────────────────────────────────────────────────

function serializeRoom(room) {
  return {
    ...room,
    members: Array.from(room.members.entries()),
    bannedUsers: Array.from(room.bannedUsers),
    _io: undefined, // never persist socket.io instance
  };
}

function deserializeRoom(data) {
  return {
    ...data,
    members: new Map(data.members || []),
    bannedUsers: new Set(data.bannedUsers || []),
    _io: null,
  };
}

// ─── Redis Persistence ────────────────────────────────────────────────────────
// Per-room write state: roomId -> { inFlight: Promise | null, isDirty: boolean, debounceTimer: Timeout | null }
export const persistenceState = new Map();

/**
 * Execute actual Redis set command.
 */
async function executeSave(room) {
  if (!redis || !room) return;
  try {
    const serialized = JSON.stringify(serializeRoom(room));
    await redis.set(ROOM_KEY(room.roomId), serialized, { ex: ROOM_TTL_SECONDS });
  } catch (err) {
    console.error(`[Redis] Failed to save room ${room?.roomId}:`, err.message);
  }
}

/**
 * Flush the latest authoritative in-memory room state to Redis.
 * Ensures only ONE write is in-flight at a time per room.
 * If mutations arrive while a write is in-flight, 'isDirty' is flagged and flushes upon completion.
 */
function flushPersistence(roomId) {
  const room = rooms.get(roomId);
  if (!redis || !room) {
    persistenceState.delete(roomId);
    return;
  }

  let state = persistenceState.get(roomId);
  if (!state) {
    state = { inFlight: null, isDirty: false, debounceTimer: null };
    persistenceState.set(roomId, state);
  }

  if (state.inFlight) {
    state.isDirty = true;
    return;
  }

  state.isDirty = false;
  state.inFlight = executeSave(room).finally(() => {
    state.inFlight = null;
    if (state.isDirty) {
      state.isDirty = false;
      const latestRoom = rooms.get(roomId);
      if (latestRoom) {
        flushPersistence(roomId);
      } else {
        persistenceState.delete(roomId);
      }
    } else {
      persistenceState.delete(roomId);
    }
  });
}

/**
 * Persist room state to Redis with per-room write serialization.
 * @param {Object} room - The live room object.
 * @param {Object} [options] - Options.
 * @param {number} [options.debounceMs=0] - If > 0, debounces rapid successive writes (e.g. continuous playback scrubbing).
 */
export function persistRoom(room, { debounceMs = 0 } = {}) {
  if (!room || !room.roomId) return;
  const roomId = room.roomId;

  let state = persistenceState.get(roomId);
  if (!state) {
    state = { inFlight: null, isDirty: false, debounceTimer: null };
    persistenceState.set(roomId, state);
  }

  if (debounceMs > 0) {
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      state.debounceTimer = null;
      flushPersistence(roomId);
    }, debounceMs);
    if (state.debounceTimer.unref) state.debounceTimer.unref();
  } else {
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = null;
    }
    flushPersistence(roomId);
  }
}

/**
 * Load a room from Redis into memory. Returns the hydrated room or null.
 */
async function loadRoomFromRedis(roomId) {
  if (!redis) return null;
  try {
    const data = await redis.get(ROOM_KEY(roomId));
    if (!data) return null;
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const room = deserializeRoom(parsed);
    rooms.set(room.roomId, room);
    console.log(`[Redis] Hydrated room ${room.roomId} from Redis`);
    return room;
  } catch (err) {
    console.error(`[Redis] Failed to load room ${roomId}:`, err.message);
    return null;
  }
}

/**
 * Delete a room from both memory and Redis.
 */
export async function deleteRoom(roomId) {
  const state = persistenceState.get(roomId);
  if (state && state.debounceTimer) {
    clearTimeout(state.debounceTimer);
  }
  persistenceState.delete(roomId);
  rooms.delete(roomId);
  if (redis) {
    try {
      await redis.del(ROOM_KEY(roomId));
    } catch (err) {
      console.error(`[Redis] Failed to delete room ${roomId}:`, err.message);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRoomCode() {
  const chars = '0123456789';
  let code = '';
  let attempts = 0;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
  } while (rooms.has(code) && attempts < 100);
  return code;
}

function pushChatMessage(room, msg) {
  room.chatHistory.push(msg);
  if (room.chatHistory.length > 100) room.chatHistory.shift();
}

const RECONNECT_GRACE_MS = 30000;

// ─── RoomManager ─────────────────────────────────────────────────────────────

export const RoomManager = {

  createRoom(hostUserId, hostSocketId, hostNickname, hostAvatar, roomName, mood) {
    const roomId = generateRoomCode();
    const hostUser = {
      userId: hostUserId || hostSocketId,
      socketIds: [hostSocketId],
      nickname: hostNickname || 'Guest',
      avatar: hostAvatar || null,
      joinedAt: Date.now()
    };

    const room = {
      roomId,
      hostId: hostUser.userId,
      currentVideo: {},
      videoQueue: [],
      settings: {
        allowMemberControls: true,
        roomName: roomName || `${hostNickname || 'Guest'}'s Watch Party`,
        mood: mood || 'cosy'
      },
      playback: {
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now()
      },
      members: new Map([[hostUser.userId, hostUser]]),
      bannedUsers: new Set(),
      chatHistory: [
        {
          id: 'sys-init',
          sender: 'System',
          text: `Room created by ${hostUser.nickname}. Share the code or link to invite friends!`,
          isSystem: true,
          timestamp: Date.now()
        }
      ],
      _io: null
    };

    rooms.set(roomId, room);
    persistRoom(room);
    return room;
  },

  /**
   * Synchronous get from memory only. Fast path for most operations.
   */
  getRoom(roomId) {
    if (!roomId) return null;
    const normalized = roomId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return rooms.get(normalized) || null;
  },

  /**
   * Async get: tries memory first, then Redis. Use for join_room.
   */
  async ensureRoom(roomId) {
    if (!roomId) return null;
    const normalized = roomId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const inMemory = rooms.get(normalized);
    if (inMemory) return inMemory;
    return await loadRoomFromRedis(normalized);
  },

  getMemberBySocketId(room, socketId) {
    for (const member of room.members.values()) {
      if (member.socketIds.includes(socketId)) return member;
    }
    return null;
  },

  joinRoom(roomId, userId, socketId, nickname, avatar) {
    const room = this.getRoom(roomId);
    if (!room) return { error: 'Room not found' };

    const actualUserId = userId || socketId;

    if (room.bannedUsers.has(actualUserId)) {
      return { error: 'You have been kicked from this room.' };
    }

    if (room.members.has(actualUserId)) {
      const member = room.members.get(actualUserId);
      if (!member.socketIds.includes(socketId)) {
        member.socketIds.push(socketId);
      }
      persistRoom(room);
      return { room, member, wasReconnect: true };
    }

    const wasHostOrKnown = room.hostId === actualUserId;

    const member = {
      userId: actualUserId,
      socketIds: [socketId],
      nickname: nickname || `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: avatar || null,
      joinedAt: Date.now()
    };

    pushChatMessage(room, {
      id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'System',
      text: `${member.nickname} joined the room.`,
      isSystem: true,
      timestamp: Date.now()
    });

    room.members.set(actualUserId, member);
    persistRoom(room);
    return { room, member, wasReconnect: wasHostOrKnown };
  },

  leaveRoom(socketId, preferredRoomId = null) {
    const processLeave = (roomId, room, member) => {
      member.socketIds = member.socketIds.filter(id => id !== socketId);

      if (member.socketIds.length > 0) {
        return { roomId, room, member, sessionEnded: false };
      }

      room.members.delete(member.userId);

      // Immediately push leave presence message
      pushChatMessage(room, {
        id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'System',
        text: `${member.nickname} left the room.`,
        isSystem: true,
        timestamp: Date.now()
      });

      // If host disconnected, transfer host to next oldest active member if any remain
      if (room.hostId === member.userId && room.members.size > 0) {
        const nextHost = Array.from(room.members.values())
          .sort((a, b) => a.joinedAt - b.joinedAt)[0];
        if (nextHost) {
          room.hostId = nextHost.userId;
          pushChatMessage(room, {
            id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sender: 'System',
            text: `${nextHost.nickname} is the new host.`,
            isSystem: true,
            timestamp: Date.now()
          });
        }
      }

      persistRoom(room);
      return { roomId, room, member, sessionEnded: false };
    };

    if (preferredRoomId) {
      const room = this.getRoom(preferredRoomId);
      if (room) {
        const member = this.getMemberBySocketId(room, socketId);
        if (member) return processLeave(room.roomId, room, member);
      }
    }

    for (const [roomId, room] of rooms.entries()) {
      const member = this.getMemberBySocketId(room, socketId);
      if (member) return processLeave(roomId, room, member);
    }
    return null;
  },

  intentionalLeave(socketId, preferredRoomId = null) {
    const processIntentionalLeave = (roomId, room, member) => {
      member.socketIds = member.socketIds.filter(id => id !== socketId);
      let sessionEnded = false;

      if (room.hostId === member.userId) {
        // Host intentionally left — disband room
        sessionEnded = true;
        deleteRoom(roomId);
      } else {
        room.members.delete(member.userId);
        pushChatMessage(room, {
          id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender: 'System',
          text: `${member.nickname} left the room.`,
          isSystem: true,
          timestamp: Date.now()
        });
        persistRoom(room);
      }

      return { roomId, room, member, sessionEnded };
    };

    if (preferredRoomId) {
      const room = this.getRoom(preferredRoomId);
      if (room) {
        const member = this.getMemberBySocketId(room, socketId);
        if (member) return processIntentionalLeave(room.roomId, room, member);
      }
    }

    for (const [roomId, room] of rooms.entries()) {
      const member = this.getMemberBySocketId(room, socketId);
      if (member) return processIntentionalLeave(roomId, room, member);
    }
    return null;
  },

  updatePlayback(roomId, socketId, { isPlaying, currentTime, youtubeId, videoUrl, title, hasEnded }) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = this.getMemberBySocketId(room, socketId);
    if (!member) return null;

    if (!room.settings.allowMemberControls && room.hostId !== member.userId) {
      return { error: 'Only the host can control playback.' };
    }

    const nextId = youtubeId || videoUrl;
    if (nextId && (nextId !== room.currentVideo.youtubeId && nextId !== room.currentVideo.videoUrl)) {
      room.currentVideo = {
        youtubeId: nextId,
        videoUrl: nextId,
        title: title || 'Media Track'
      };
      pushChatMessage(room, {
        id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'System',
        text: `${member.nickname} changed the video.`,
        isSystem: true,
        timestamp: Date.now()
      });
    }

    const prevPlaying = room.playback.isPlaying;
    const isNewVideo = Boolean(nextId && (nextId !== room.currentVideo.youtubeId && nextId !== room.currentVideo.videoUrl));

    room.playback = {
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : room.playback.isPlaying,
      currentTime: typeof currentTime === 'number' ? Math.max(0, currentTime) : room.playback.currentTime,
      hasEnded: hasEnded === true,
      updatedAt: Date.now()
    };

    const isStateChange = isNewVideo || (typeof isPlaying === 'boolean' && isPlaying !== prevPlaying) || hasEnded;
    persistRoom(room, { debounceMs: isStateChange ? 0 : 500 });
    return { room };
  },

  addToQueue(roomId, socketId, video) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const member = this.getMemberBySocketId(room, socketId);
    if (!member) return { error: 'User not found in room.' };

    if (!room.settings.allowMemberControls && room.hostId !== member.userId) {
      return { error: 'Only the host can modify the queue.' };
    }

    if (!room.currentVideo.youtubeId || room.playback.hasEnded) {
      room.currentVideo = {
        youtubeId: video.youtubeId,
        title: video.title || 'YouTube Video'
      };
      room.playback = {
        isPlaying: true,
        currentTime: 0,
        hasEnded: false,
        updatedAt: Date.now()
      };
      pushChatMessage(room, {
        id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'System',
        text: `${member.nickname} started playing "${video.title}".`,
        isSystem: true,
        timestamp: Date.now()
      });
      persistRoom(room);
      return { room };
    }

    if (room.videoQueue.length >= 50) {
      return { error: 'Queue is full (maximum 50 videos).' };
    }

    const queueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      youtubeId: video.youtubeId,
      title: video.title || 'YouTube Video',
      addedBy: member.nickname,
      addedAt: Date.now()
    };

    room.videoQueue.push(queueItem);

    pushChatMessage(room, {
      id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'System',
      text: `${member.nickname} added "${video.title}" to the queue.`,
      isSystem: true,
      timestamp: Date.now()
    });

    persistRoom(room);
    return { room };
  },

  removeFromQueue(roomId, socketId, queueId) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const member = this.getMemberBySocketId(room, socketId);
    if (!member) return null;

    if (!room.settings.allowMemberControls && room.hostId !== member.userId) {
      return { error: 'Only the host can modify the queue.' };
    }

    room.videoQueue = room.videoQueue.filter(v => v.id !== queueId);
    persistRoom(room);
    return { room };
  },

  playNext(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const member = this.getMemberBySocketId(room, socketId);
    if (!member) return null;

    if (!room.settings.allowMemberControls && room.hostId !== member.userId) {
      return { error: 'Only the host can control playback.' };
    }

    if (room.videoQueue.length === 0) return { room };

    const nextVideo = room.videoQueue.shift();
    room.currentVideo = {
      youtubeId: nextVideo.youtubeId,
      title: nextVideo.title
    };

    room.playback = {
      isPlaying: true,
      currentTime: 0,
      hasEnded: false,
      updatedAt: Date.now()
    };

    pushChatMessage(room, {
      id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'System',
      text: `Now playing "${nextVideo.title}".`,
      isSystem: true,
      timestamp: Date.now()
    });

    persistRoom(room);
    return { room };
  },

  updateRoomSettings(roomId, socketId, newSettings) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = this.getMemberBySocketId(room, socketId);
    if (!member || room.hostId !== member.userId) {
      return { error: 'Only the host can change room settings.' };
    }

    room.settings = { ...room.settings, ...newSettings };

    pushChatMessage(room, {
      id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'System',
      text: `Host updated room settings.`,
      isSystem: true,
      timestamp: Date.now()
    });

    persistRoom(room);
    return { room };
  },

  kickUser(roomId, socketId, targetUserId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = this.getMemberBySocketId(room, socketId);
    if (!member || room.hostId !== member.userId) {
      return { error: 'Only the host can kick users.' };
    }

    if (room.hostId === targetUserId) return { error: 'Cannot kick the host.' };

    const targetUser = room.members.get(targetUserId);
    if (!targetUser) return { error: 'User not found.' };

    const kickedSocketIds = [...targetUser.socketIds];
    room.bannedUsers.add(targetUserId);
    room.members.delete(targetUserId);

    pushChatMessage(room, {
      id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'System',
      text: `${targetUser.nickname} was kicked by the host.`,
      isSystem: true,
      timestamp: Date.now()
    });

    persistRoom(room);
    return { room, kickedSocketIds };
  },

  transferHost(roomId, socketId, targetUserId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return { error: 'Invalid target user ID for host transfer.' };
    }

    const member = this.getMemberBySocketId(room, socketId);
    if (!member || room.hostId !== member.userId) {
      return { error: 'Only the host can transfer host privileges.' };
    }

    const targetUser = room.members.get(targetUserId);
    if (!targetUser) return { error: 'Target user not found.' };

    room.hostId = targetUserId;

    pushChatMessage(room, {
      id: `sys-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'System',
      text: `${targetUser.nickname} is the new host.`,
      isSystem: true,
      timestamp: Date.now()
    });

    persistRoom(room);
    return { room };
  },

  addChatMessage(roomId, socketId, text) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = this.getMemberBySocketId(room, socketId);
    if (!member) return null;

    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: member.nickname,
      senderId: member.userId,
      avatar: member.avatar,
      color: '#0145F2',
      text: text.trim(),
      isSystem: false,
      timestamp: Date.now()
    };

    room.chatHistory.push(msg);
    if (room.chatHistory.length > 100) room.chatHistory.shift();

    persistRoom(room);
    return { room, message: msg };
  },

  getRoomStateDTO(room) {
    if (!room) return null;

    let liveCurrentTime = room.playback.currentTime;
    if (room.playback.isPlaying) {
      const elapsedSeconds = (Date.now() - room.playback.updatedAt) / 1000;
      liveCurrentTime += elapsedSeconds;
    }

    return {
      roomId: room.roomId,
      hostId: room.hostId,
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      settings: room.settings,
      playback: {
        ...room.playback,
        currentTime: liveCurrentTime
      },
      members: Array.from(room.members.values()),
      chatHistory: room.chatHistory
    };
  }
};

// ─── Periodic Memory Eviction ─────────────────────────────────────────────────
// Only evicts empty/inactive rooms from MEMORY (not Redis).
// Keeps active rooms in memory. Redis is the source of truth for persistence.
export const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (room.members.size === 0) {
      // Evict idle empty rooms from memory — they remain in Redis
      rooms.delete(roomId);
    } else {
      // Evict rooms inactive for > 2 hours from memory (they are safe in Redis)
      const isIdle = (now - room.playback.updatedAt > 2 * 60 * 60 * 1000);
      if (isIdle) {
        rooms.delete(roomId);
      }
    }
  }
}, 600000); // every 10 minutes
if (cleanupInterval.unref) cleanupInterval.unref();
