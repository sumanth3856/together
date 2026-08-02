// In-memory room manager for Together watch party app
export const rooms = new Map();

// Track disconnected users awaiting reconnect: userId -> { roomId, timer }
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

// Grace period before a disconnected host/member's room is deleted (30 seconds)
const RECONNECT_GRACE_MS = 30000;

export const RoomManager = {
  createRoom(hostUserId, hostSocketId, hostNickname, hostAvatar) {
    const roomId = generateRoomCode();
    const hostUser = {
      userId: hostUserId || hostSocketId, // Fallback for backwards compatibility if needed
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
        allowMemberControls: true
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

  getMemberBySocketId(room, socketId) {
    for (const member of room.members.values()) {
      if (member.socketIds.includes(socketId)) return member;
    }
    return null;
  },

  joinRoom(roomId, userId, socketId, nickname, avatar) {
    const room = this.getRoom(roomId);
    if (!room) return { error: 'Room not found' };

    const actualUserId = userId || socketId; // Fallback
    
    if (room.bannedUsers.has(actualUserId)) {
      return { error: 'You have been kicked from this room.' };
    }

    // Check if user is already in the room (e.g. another tab)
    if (room.members.has(actualUserId)) {
      const member = room.members.get(actualUserId);
      if (!member.socketIds.includes(socketId)) {
        member.socketIds.push(socketId);
      }
      
      // Cancel any pending disconnect timer if they had completely disconnected previously
      if (pendingReconnects.has(actualUserId)) {
        clearTimeout(pendingReconnects.get(actualUserId).timer);
        pendingReconnects.delete(actualUserId);
        
        room.chatHistory.push({
          id: `sys-rejoin-${Date.now()}`,
          sender: 'System',
          text: `${member.nickname} reconnected.`,
          isSystem: true,
          timestamp: Date.now()
        });
      }
      return { room, member, wasReconnect: true };
    }

    // Check if they are in pendingReconnects but somehow missing from the room (shouldn't happen, but just in case)
    if (pendingReconnects.has(actualUserId)) {
      clearTimeout(pendingReconnects.get(actualUserId).timer);
      pendingReconnects.delete(actualUserId);
    }

    // Fresh join
    const member = {
      userId: actualUserId,
      socketIds: [socketId],
      nickname: nickname || `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: avatar || null,
      joinedAt: Date.now()
    };

    room.chatHistory.push({
      id: `sys-join-${Date.now()}`,
      sender: 'System',
      text: `${member.nickname} joined the room.`,
      isSystem: true,
      timestamp: Date.now()
    });

    if (room.chatHistory.length > 100) room.chatHistory.shift();
    room.members.set(actualUserId, member);

    return { room, member, wasReconnect: false };
  },

  leaveRoom(socketId) {
    for (const [roomId, room] of rooms.entries()) {
      const member = this.getMemberBySocketId(room, socketId);
      if (member) {
        // Remove this specific socket
        member.socketIds = member.socketIds.filter(id => id !== socketId);
        
        // If the user still has other sockets open in this room, do not trigger a leave event
        if (member.socketIds.length > 0) {
          return { roomId, room, member, sessionEnded: false };
        }

        // Otherwise, they are fully disconnected from this room
        room.members.delete(member.userId);

        // Schedule grace-period deletion
        const timer = setTimeout(() => {
          pendingReconnects.delete(member.userId);
          const currentRoom = rooms.get(roomId);
          if (!currentRoom) return; 
          
          if (currentRoom.members.size === 0) {
            rooms.delete(roomId);
            return { roomId, sessionEnded: true };
          } else if (currentRoom.hostId === member.userId) {
            // Auto-promote the oldest surviving member
            const nextHost = Array.from(currentRoom.members.values()).sort((a, b) => a.joinedAt - b.joinedAt)[0];
            if (nextHost) {
              currentRoom.hostId = nextHost.userId;
              currentRoom.chatHistory.push({
                id: `sys-promo-${Date.now()}`,
                sender: 'System',
                text: `${nextHost.nickname} is the new host.`,
                isSystem: true,
                timestamp: Date.now()
              });
            }
          }
        }, RECONNECT_GRACE_MS);

        pendingReconnects.set(member.userId, {
          roomId,
          timer
        });

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

  intentionalLeave(socketId) {
    for (const [roomId, room] of rooms.entries()) {
      const member = this.getMemberBySocketId(room, socketId);
      if (member) {
        // Fully remove user regardless of how many sockets they have open
        room.members.delete(member.userId);

        if (pendingReconnects.has(member.userId)) {
          clearTimeout(pendingReconnects.get(member.userId).timer);
          pendingReconnects.delete(member.userId);
        }

        let sessionEnded = false;
        if (room.members.size === 0) {
          rooms.delete(roomId);
          sessionEnded = true;
        } else {
          // If the host left, automatically promote the oldest member
          if (room.hostId === member.userId) {
            const nextHost = Array.from(room.members.values()).sort((a, b) => a.joinedAt - b.joinedAt)[0];
            if (nextHost) {
              room.hostId = nextHost.userId;
              room.chatHistory.push({
                id: `sys-promo-${Date.now()}`,
                sender: 'System',
                text: `${nextHost.nickname} is the new host.`,
                isSystem: true,
                timestamp: Date.now()
              });
            }
          }

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

  updatePlayback(roomId, socketId, { isPlaying, currentTime, youtubeId, title, hasEnded }) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = this.getMemberBySocketId(room, socketId);
    if (!member) {
      return { error: 'User not found in room.' };
    }

    if (!room.settings.allowMemberControls && room.hostId !== member.userId) {
      return { error: 'Only the host can control playback.' };
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
      hasEnded: hasEnded === true,
      updatedAt: Date.now()
    };

    return { room };
  },

  addToQueue(roomId, socketId, video) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    const member = this.getMemberBySocketId(room, socketId);
    if (!member) {
      return { error: 'User not found in room.' };
    }

    if (!room.settings.allowMemberControls && room.hostId !== member.userId) {
      return { error: 'Only the host can modify the queue.' };
    }

    // If player is completely empty or the previous video ended, play it immediately instead of queueing
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
      
      room.chatHistory.push({
        id: `sys-play-${Date.now()}`,
        sender: 'System',
        text: `${member.nickname} started playing "${video.title}".`,
        isSystem: true,
        timestamp: Date.now()
      });
      return { room };
    }

    room.videoQueue.push({
      ...video,
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      addedBy: member.nickname
    });

    room.chatHistory.push({
      id: `sys-queue-${Date.now()}`,
      sender: 'System',
      text: `${member.nickname} added "${video.title}" to the queue.`,
      isSystem: true,
      timestamp: Date.now()
    });

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

    if (room.videoQueue.length === 0) return { room }; // Nothing to play

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

    room.chatHistory.push({
      id: `sys-next-${Date.now()}`,
      sender: 'System',
      text: `Playing next: ${nextVideo.title}`,
      isSystem: true,
      timestamp: Date.now()
    });

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
    
    room.chatHistory.push({
      id: `sys-settings-${Date.now()}`,
      sender: 'System',
      text: `Host updated room settings.`,
      isSystem: true,
      timestamp: Date.now()
    });

    return { room };
  },

  kickUser(roomId, socketId, targetUserId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = this.getMemberBySocketId(room, socketId);
    if (!member || room.hostId !== member.userId) {
      return { error: 'Only the host can kick users.' };
    }

    if (room.hostId === targetUserId) {
      return { error: 'Cannot kick the host.' };
    }

    const targetUser = room.members.get(targetUserId);
    if (!targetUser) {
      return { error: 'User not found.' };
    }

    const kickedSocketIds = [...targetUser.socketIds];
    room.bannedUsers.add(targetUserId);
    room.members.delete(targetUserId);

    room.chatHistory.push({
      id: `sys-kick-${Date.now()}`,
      sender: 'System',
      text: `${targetUser.nickname} was kicked by the host.`,
      isSystem: true,
      timestamp: Date.now()
    });

    return { room, kickedSocketIds };
  },

  transferHost(roomId, socketId, targetUserId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const member = this.getMemberBySocketId(room, socketId);
    if (!member || room.hostId !== member.userId) {
      return { error: 'Only the host can transfer host privileges.' };
    }

    const targetUser = room.members.get(targetUserId);
    if (!targetUser) {
      return { error: 'Target user not found.' };
    }

    room.hostId = targetUserId;

    room.chatHistory.push({
      id: `sys-host-${Date.now()}`,
      sender: 'System',
      text: `${targetUser.nickname} is the new host.`,
      isSystem: true,
      timestamp: Date.now()
    });

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
export const cleanupInterval = setInterval(() => {
  const now = Date.now();
  
  // O(P) pass to gather rooms with pending reconnects
  const roomsWithPending = new Set();
  for (const p of pendingReconnects.values()) {
    roomsWithPending.add(p.roomId);
  }

  // O(R) pass to cleanup
  for (const [roomId, room] of rooms.entries()) {
    if (room.members.size === 0) {
      if (!roomsWithPending.has(roomId)) {
        rooms.delete(roomId);
      }
    } else {
      // Clean up rooms older than 24 hours to prevent memory leaks if they get orphaned
      // using playback.updatedAt as a proxy for last activity
      const isExpired = (now - room.playback.updatedAt > 86400000);
      if (isExpired) rooms.delete(roomId);
    }
  }
}, 600000);
