// In-memory room manager for Together watch party app
export const rooms = new Map();

// Track disconnected sockets awaiting reconnect: socketId -> { roomId, nickname, isHost, hasControl, color, timer }
const pendingReconnects = new Map();

// Helper to generate readable random room ID (e.g. TOG-8492)
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TOG-${code}`;
}

const AVATAR_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A1',
  '#33FFF5', '#FFC733', '#9D33FF', '#00E676', '#FF9100'
];

function getRandomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Grace period before a disconnected host/member's room is deleted (30 seconds)
const RECONNECT_GRACE_MS = 30000;

export const RoomManager = {
  createRoom(hostSocketId, hostNickname) {
    const roomId = generateRoomCode();
    const hostUser = {
      socketId: hostSocketId,
      nickname: hostNickname || 'Host',
      color: getRandomColor(),
      isHost: true,
      hasControl: true,
      joinedAt: Date.now()
    };

    const room = {
      roomId,
      hostId: hostSocketId,
      currentVideo: {
        youtubeId: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)'
      },
      playback: {
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now()
      },
      members: new Map([[hostSocketId, hostUser]]),
      controlRequests: new Map(),
      chatHistory: [
        {
          id: 'sys-init',
          sender: 'System',
          text: `Room created by ${hostUser.nickname}. Share the code or link to invite friends!`,
          isSystem: true,
          timestamp: Date.now()
        }
      ]
    };

    rooms.set(roomId, room);
    return room;
  },

  getRoom(roomId) {
    if (!roomId) return null;
    // Strip everything except letters, numbers, and dashes
    let normalized = roomId.toUpperCase().replace(/[^A-Z0-9\-]/g, '');

    // Add prefix if they just typed the 4-character code
    if (normalized.length === 4) {
      normalized = `TOG-${normalized}`;
    }
    // Add dash if they typed TOG1234 instead of TOG-1234
    else if (normalized.length === 7 && normalized.startsWith('TOG') && !normalized.includes('-')) {
      normalized = `TOG-${normalized.substring(3)}`;
    }

    return rooms.get(normalized) || null;
  },

  /**
   * joinRoom - supports both fresh joins and seamless reconnects.
   * If the user was previously in the room (matched by nickname+roomId),
   * their session is restored rather than creating a duplicate entry.
   */
  joinRoom(roomId, socketId, nickname) {
    const room = this.getRoom(roomId);
    if (!room) return { error: 'Room not found' };

    // --- Seamless Reconnect: check if this nickname was recently in this room ---
    let existingMemberData = null;
    for (const [pendingSocketId, pendingData] of pendingReconnects.entries()) {
      if (pendingData.roomId === room.roomId && pendingData.nickname === nickname) {
        existingMemberData = pendingData;
        // Cancel the pending deletion timer
        clearTimeout(pendingData.timer);
        pendingReconnects.delete(pendingSocketId);
        break;
      }
    }

    let member;
    if (existingMemberData) {
      // Restore previous session with original role (host/control)
      member = {
        socketId, // new socket ID after reconnect
        nickname: existingMemberData.nickname,
        color: existingMemberData.color,
        isHost: existingMemberData.isHost,
        hasControl: existingMemberData.hasControl || existingMemberData.isHost,
        joinedAt: existingMemberData.joinedAt || Date.now()
      };

      // If this was the host reconnecting, restore host status
      if (existingMemberData.isHost) {
        room.hostId = socketId;
      }

      room.chatHistory.push({
        id: `sys-rejoin-${Date.now()}`,
        sender: 'System',
        text: `${member.nickname} reconnected.`,
        isSystem: true,
        timestamp: Date.now()
      });
    } else {
      // Fresh join
      const isFirstMember = room.members.size === 0;
      member = {
        socketId,
        nickname: nickname || `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
        color: getRandomColor(),
        isHost: isFirstMember,
        hasControl: isFirstMember,
        joinedAt: Date.now()
      };

      if (isFirstMember) {
        room.hostId = socketId;
      }

      room.chatHistory.push({
        id: `sys-join-${Date.now()}`,
        sender: 'System',
        text: `${member.nickname} joined the room.`,
        isSystem: true,
        timestamp: Date.now()
      });
    }

    if (room.chatHistory.length > 100) room.chatHistory.shift();
    room.members.set(socketId, member);

    return { room, member, wasReconnect: !!existingMemberData };
  },

  /**
   * leaveRoom - called on socket disconnect.
   * Instead of immediately deleting the room, puts the user in a
   * "pending reconnect" grace period (30s). If they reconnect within
   * that window, their session is fully restored.
   */
  leaveRoom(socketId) {
    for (const [roomId, room] of rooms.entries()) {
      if (room.members.has(socketId)) {
        const member = room.members.get(socketId);
        room.members.delete(socketId);
        room.controlRequests.delete(socketId);

        // Schedule grace-period deletion
        const timer = setTimeout(() => {
          // Grace period expired — this is a real leave, not a reload
          pendingReconnects.delete(socketId);

          const currentRoom = rooms.get(roomId);
          if (!currentRoom) return; // Already deleted

          if (member.isHost) {
            // Host truly left — disband the room
            rooms.delete(roomId);
            return { roomId, sessionEnded: true };
          }
          // Regular member truly left — room stays, nothing special needed
        }, RECONNECT_GRACE_MS);

        // Store disconnect data for potential reconnect
        pendingReconnects.set(socketId, {
          roomId,
          nickname: member.nickname,
          color: member.color,
          isHost: member.isHost,
          hasControl: member.hasControl,
          joinedAt: member.joinedAt,
          timer,
          disconnectedAt: Date.now()
        });

        // System message about leaving (will show, but "reconnected" msg will follow if they come back)
        room.chatHistory.push({
          id: `sys-leave-${Date.now()}`,
          sender: 'System',
          text: `${member.nickname} disconnected.`,
          isSystem: true,
          timestamp: Date.now()
        });

        return { roomId, room, member, sessionEnded: false };
      }
    }
    return null;
  },

  /**
   * intentionalLeave - called when user explicitly clicks "Leave Room".
   * This immediately disbands (if host) or removes (if guest) with no grace period.
   */
  intentionalLeave(socketId) {
    // Cancel any pending reconnect timer for this socket
    if (pendingReconnects.has(socketId)) {
      clearTimeout(pendingReconnects.get(socketId).timer);
      pendingReconnects.delete(socketId);
    }

    for (const [roomId, room] of rooms.entries()) {
      if (room.members.has(socketId)) {
        const member = room.members.get(socketId);
        room.members.delete(socketId);
        room.controlRequests.delete(socketId);

        let sessionEnded = false;

        if (room.hostId === socketId) {
          // Host intentionally left — disband immediately
          rooms.delete(roomId);
          sessionEnded = true;
        } else {
          room.chatHistory.push({
            id: `sys-leave-${Date.now()}`,
            sender: 'System',
            text: `${member.nickname} left the room.`,
            isSystem: true,
            timestamp: Date.now()
          });
        }

        return { roomId, room, member, sessionEnded };
      }
    }
    return null;
  },

  updatePlayback(roomId, socketId, { isPlaying, currentTime, youtubeId, title }) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = room.members.get(socketId);
    if (!member || (!member.isHost && !member.hasControl)) {
      return { error: 'Permission denied. Only host or users with control can manage playback.' };
    }

    if (youtubeId && youtubeId !== room.currentVideo.youtubeId) {
      room.currentVideo = {
        youtubeId,
        title: title || 'YouTube Video'
      };
      room.chatHistory.push({
        id: `sys-vid-${Date.now()}`,
        sender: 'System',
        text: `${member.nickname} changed the video.`,
        isSystem: true,
        timestamp: Date.now()
      });
    }

    room.playback = {
      isPlaying: typeof isPlaying === 'boolean' ? isPlaying : room.playback.isPlaying,
      currentTime: typeof currentTime === 'number' ? currentTime : room.playback.currentTime,
      updatedAt: Date.now()
    };

    return { room };
  },

  requestControl(roomId, socketId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = room.members.get(socketId);
    if (!member) return null;

    if (member.isHost || member.hasControl) {
      return { status: 'already_has_control' };
    }

    const requestData = {
      socketId,
      nickname: member.nickname,
      requestedAt: Date.now()
    };

    room.controlRequests.set(socketId, requestData);
    return { room, hostSocketId: room.hostId, requestData };
  },

  handleControlResponse(roomId, hostSocketId, targetSocketId, approved) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    if (room.hostId !== hostSocketId) {
      return { error: 'Only the host can respond to control requests.' };
    }

    room.controlRequests.delete(targetSocketId);
    const targetMember = room.members.get(targetSocketId);

    if (!targetMember) return null;

    if (approved) {
      targetMember.hasControl = true;
      room.chatHistory.push({
        id: `sys-ctrl-grant-${Date.now()}`,
        sender: 'System',
        text: `${room.members.get(hostSocketId)?.nickname || 'Host'} granted playback control to ${targetMember.nickname}.`,
        isSystem: true,
        timestamp: Date.now()
      });
    } else {
      targetMember.hasControl = false;
    }

    return { room, targetMember, approved };
  },

  revokeControl(roomId, hostSocketId, targetSocketId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    if (room.hostId !== hostSocketId) return { error: 'Only the host can revoke controls.' };

    const targetMember = room.members.get(targetSocketId);
    if (targetMember && !targetMember.isHost) {
      targetMember.hasControl = false;
      room.chatHistory.push({
        id: `sys-ctrl-revoke-${Date.now()}`,
        sender: 'System',
        text: `Host revoked playback control from ${targetMember.nickname}.`,
        isSystem: true,
        timestamp: Date.now()
      });
    }

    return { room, targetMember };
  },

  addChatMessage(roomId, socketId, text) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = room.members.get(socketId);
    if (!member) return null;

    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: member.nickname,
      color: member.color,
      isHost: member.isHost,
      hasControl: member.hasControl,
      text: text.trim(),
      isSystem: false,
      timestamp: Date.now()
    };

    room.chatHistory.push(msg);
    if (room.chatHistory.length > 100) room.chatHistory.shift();

    return { room, message: msg };
  },

  getRoomStateDTO(room) {
    if (!room) return null;

    // Calculate accurate live interpolated time
    let liveCurrentTime = room.playback.currentTime;
    if (room.playback.isPlaying) {
      const elapsedSeconds = (Date.now() - room.playback.updatedAt) / 1000;
      liveCurrentTime += elapsedSeconds;
    }

    return {
      roomId: room.roomId,
      hostId: room.hostId,
      currentVideo: room.currentVideo,
      playback: {
        ...room.playback,
        currentTime: liveCurrentTime
      },
      members: Array.from(room.members.values()),
      controlRequests: Array.from(room.controlRequests.values()),
      chatHistory: room.chatHistory
    };
  }
};

// Global Memory Sweeper (Runs every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (room.members.size === 0) {
      // Only delete if no pending reconnects are associated with this room
      const hasPendingReconnect = Array.from(pendingReconnects.values()).some(p => p.roomId === roomId);
      if (!hasPendingReconnect) {
        rooms.delete(roomId);
      }
    } else {
      // Hard expiration: 24 hours
      const isExpired = room.chatHistory[0] && (now - room.chatHistory[0].timestamp > 86400000);
      if (isExpired) rooms.delete(roomId);
    }
  }
}, 600000);
