// In-memory room manager for Together watch party app
const rooms = new Map();

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
        youtubeId: 'dQw4w9WgXcQ', // Default fallback video
        title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)'
      },
      playback: {
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now()
      },
      members: new Map([[hostSocketId, hostUser]]),
      controlRequests: new Map(), // socketId -> { socketId, nickname, requestedAt }
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
    return rooms.get(roomId.toUpperCase()) || null;
  },

  joinRoom(roomId, socketId, nickname) {
    const room = this.getRoom(roomId);
    if (!room) return { error: 'Room not found' };

    const member = {
      socketId,
      nickname: nickname || `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
      color: getRandomColor(),
      isHost: false,
      hasControl: false,
      joinedAt: Date.now()
    };

    room.members.set(socketId, member);

    // System announcement
    room.chatHistory.push({
      id: `sys-join-${Date.now()}`,
      sender: 'System',
      text: `${member.nickname} joined the room.`,
      isSystem: true,
      timestamp: Date.now()
    });
    if (room.chatHistory.length > 100) room.chatHistory.shift();

    return { room, member };
  },

  leaveRoom(socketId) {
    for (const [roomId, room] of rooms.entries()) {
      if (room.members.has(socketId)) {
        const member = room.members.get(socketId);
        room.members.delete(socketId);
        room.controlRequests.delete(socketId);

        // System announcement
        room.chatHistory.push({
          id: `sys-leave-${Date.now()}`,
          sender: 'System',
          text: `${member.nickname} left the room.`,
          isSystem: true,
          timestamp: Date.now()
        });

        // Handle Host leaving
        if (room.hostId === socketId) {
          if (room.members.size > 0) {
            // Reassign host to oldest remaining member
            const nextHostSocketId = Array.from(room.members.keys())[0];
            const newHost = room.members.get(nextHostSocketId);
            newHost.isHost = true;
            newHost.hasControl = true;
            room.hostId = nextHostSocketId;

            room.chatHistory.push({
              id: `sys-host-${Date.now()}`,
              sender: 'System',
              text: `${newHost.nickname} is now the room Host.`,
              isSystem: true,
              timestamp: Date.now()
            });
          } else {
            // Delete empty room after 1 minute of inactivity
            setTimeout(() => {
              const currentRoom = rooms.get(roomId);
              if (currentRoom && currentRoom.members.size === 0) {
                rooms.delete(roomId);
              }
            }, 60000);
          }
        }

        return { roomId, room, member };
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
    return {
      roomId: room.roomId,
      hostId: room.hostId,
      currentVideo: room.currentVideo,
      playback: room.playback,
      members: Array.from(room.members.values()),
      controlRequests: Array.from(room.controlRequests.values()),
      chatHistory: room.chatHistory
    };
  }
};
