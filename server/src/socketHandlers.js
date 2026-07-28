import { RoomManager } from './roomManager.js';

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
    socket.on('create_room', ({ nickname }, callback) => {
      const room = RoomManager.createRoom(socket.id, nickname);
      currentRoomId = room.roomId;
      socket.join(room.roomId);

      if (typeof callback === 'function') {
        callback({ success: true, roomState: RoomManager.getRoomStateDTO(room) });
      }

      broadcastRoomState(room.roomId);
    });

    // 2. Join Room (handles both fresh joins and seamless reconnects)
    socket.on('join_room', ({ roomId, nickname }, callback) => {
      const result = RoomManager.joinRoom(roomId, socket.id, nickname);

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
          // Regular play/pause/seek: lightweight sync event to peers only
          socket.to(currentRoomId).emit('playback_synced', {
            playback: result.room.playback,
            currentVideo: result.room.currentVideo,
            senderId: socket.id
          });
          broadcastRoomState(currentRoomId);
        }
      }
    });

    // 5. Request Playback Control Permission
    socket.on('request_control', () => {
      if (!currentRoomId) return;

      const result = RoomManager.requestControl(currentRoomId, socket.id);
      if (!result) return;

      if (result.status === 'already_has_control') {
        socket.emit('toast_notification', { type: 'info', message: 'You already have playback control.' });
        return;
      }

      const { hostSocketId, requestData } = result;
      io.to(hostSocketId).emit('control_request_received', requestData);
      socket.emit('toast_notification', { type: 'info', message: 'Request sent to host.' });
      broadcastRoomState(currentRoomId);
    });

    // 6. Host Responds to Permission Request (Approve / Deny)
    socket.on('respond_control_request', ({ targetSocketId, approved }) => {
      if (!currentRoomId) return;

      const result = RoomManager.handleControlResponse(currentRoomId, socket.id, targetSocketId, approved);
      if (result && result.error) {
        socket.emit('error_message', { message: result.error });
        return;
      }

      if (result) {
        io.to(targetSocketId).emit('control_status_changed', {
          hasControl: approved,
          message: approved
            ? 'Host granted you playback control!'
            : 'Host declined your control request.'
        });
        broadcastRoomState(currentRoomId);
      }
    });

    // 7. Host Revokes Permission
    socket.on('revoke_control', ({ targetSocketId }) => {
      if (!currentRoomId) return;

      const result = RoomManager.revokeControl(currentRoomId, socket.id, targetSocketId);
      if (result && result.room) {
        io.to(targetSocketId).emit('control_status_changed', {
          hasControl: false,
          message: 'Host revoked playback control.'
        });
        broadcastRoomState(currentRoomId);
      }
    });

    // 8. Live Text Chat
    socket.on('send_chat', ({ text }) => {
      if (!currentRoomId || !text || !text.trim()) return;

      const result = RoomManager.addChatMessage(currentRoomId, socket.id, text);
      if (result && result.room) {
        io.to(currentRoomId).emit('chat_received', result.message);
        broadcastRoomState(currentRoomId);
      }
    });

    // 9. Floating Emoji Reaction Bursts
    socket.on('send_reaction', ({ emoji }) => {
      if (!currentRoomId || !emoji) return;

      const room = RoomManager.getRoom(currentRoomId);
      const member = room?.members.get(socket.id);

      io.to(currentRoomId).emit('reaction_triggered', {
        id: `react-${Date.now()}-${Math.random()}`,
        emoji,
        senderName: member?.nickname || 'Guest',
        senderColor: member?.color || '#FF5733',
        xPos: Math.floor(15 + Math.random() * 70)
      });
    });

    // 10. Socket Disconnect (accidental — could be a reload)
    socket.on('disconnect', () => {
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
