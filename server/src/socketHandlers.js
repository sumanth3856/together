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

    // 2. Join Room
    socket.on('join_room', ({ roomId, nickname }, callback) => {
      const result = RoomManager.joinRoom(roomId, socket.id, nickname);

      if (result.error) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        return;
      }

      const { room } = result;
      currentRoomId = room.roomId;
      socket.join(room.roomId);

      if (typeof callback === 'function') {
        callback({ success: true, roomState: RoomManager.getRoomStateDTO(room) });
      }

      broadcastRoomState(room.roomId);
    });

    // 3. Playback Synchronization (Play, Pause, Seek, Load Video)
    socket.on('sync_playback', (data) => {
      if (!currentRoomId) return;

      const result = RoomManager.updatePlayback(currentRoomId, socket.id, data);
      if (result && result.error) {
        socket.emit('error_message', { message: result.error });
        return;
      }

      if (result && result.room) {
        // Broadcast sync to everyone else in room immediately
        socket.to(currentRoomId).emit('playback_synced', {
          playback: result.room.playback,
          currentVideo: result.room.currentVideo,
          senderId: socket.id
        });
        
        // If the video actually changed (not just a pause/play/seek), broadcast the full room state 
        // to everyone (including the sender) so their VideoDetailsCard and chat updates!
        if (data.youtubeId && data.youtubeId !== result.room.currentVideo.youtubeId) {
           broadcastRoomState(currentRoomId);
        } else if (data.youtubeId) {
           // If they passed a youtubeId, they intended to change the video.
           // Even if it's the same video, we should just broadcast state to update the chat message.
           broadcastRoomState(currentRoomId);
        }
      }
    });

    // 4. Request Playback Control Permission
    socket.on('request_control', () => {
      if (!currentRoomId) return;

      const result = RoomManager.requestControl(currentRoomId, socket.id);
      if (!result) return;

      if (result.status === 'already_has_control') {
        socket.emit('toast_notification', { type: 'info', message: 'You already have playback control.' });
        return;
      }

      const { room, hostSocketId, requestData } = result;
      
      // Notify host specifically
      io.to(hostSocketId).emit('control_request_received', requestData);
      
      // Notify requesting user
      socket.emit('toast_notification', { type: 'info', message: 'Request sent to host.' });

      broadcastRoomState(currentRoomId);
    });

    // 5. Host Responds to Permission Request (Approve / Deny)
    socket.on('respond_control_request', ({ targetSocketId, approved }) => {
      if (!currentRoomId) return;

      const result = RoomManager.handleControlResponse(currentRoomId, socket.id, targetSocketId, approved);
      if (result && result.error) {
        socket.emit('error_message', { message: result.error });
        return;
      }

      if (result) {
        // Notify target user
        io.to(targetSocketId).emit('control_status_changed', {
          hasControl: approved,
          message: approved 
            ? 'Host granted you playback control!' 
            : 'Host declined your control request.'
        });

        broadcastRoomState(currentRoomId);
      }
    });

    // 6. Host Revokes Permission
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

    // 7. Live Text Chat
    socket.on('send_chat', ({ text }) => {
      if (!currentRoomId || !text || !text.trim()) return;

      const result = RoomManager.addChatMessage(currentRoomId, socket.id, text);
      if (result && result.room) {
        io.to(currentRoomId).emit('chat_received', result.message);
        broadcastRoomState(currentRoomId);
      }
    });

    // 8. Floating Emoji Reaction Bursts
    socket.on('send_reaction', ({ emoji }) => {
      if (!currentRoomId || !emoji) return;

      const room = RoomManager.getRoom(currentRoomId);
      const member = room?.members.get(socket.id);

      io.to(currentRoomId).emit('reaction_triggered', {
        id: `react-${Date.now()}-${Math.random()}`,
        emoji,
        senderName: member?.nickname || 'Guest',
        senderColor: member?.color || '#FF5733',
        xPos: Math.floor(15 + Math.random() * 70) // Random X percentage (15% to 85%)
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (currentRoomId) {
        const result = RoomManager.leaveRoom(socket.id);
        if (result) {
          if (result.sessionEnded) {
            io.to(result.roomId).emit('session_ended');
          } else if (result.room) {
            broadcastRoomState(result.roomId);
          }
        }
      }
    });
  });
}
