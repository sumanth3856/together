import test from 'node:test';
import assert from 'node:assert/strict';
import { io as ClientIO } from '../../client/node_modules/socket.io-client/build/esm/index.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from '../src/socketHandlers.js';

test('E2E Realtime Multi-User Smoke Test (Two-Session Lifecycle)', async () => {
  // 1. Setup ephemeral test server
  const httpServer = http.createServer();
  const ioServer = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });
  setupSocketHandlers(ioServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  const serverUrl = `http://localhost:${port}`;

  try {
    // 2. Client A connects & Creates Room (Host)
    const clientA = ClientIO(serverUrl, { reconnection: false, forceNew: true });
    await new Promise((resolve) => clientA.on('connect', resolve));

    let roomStateA = null;
    await new Promise((resolve, reject) => {
      clientA.emit(
        'create_room',
        { userId: 'user-alice', nickname: 'Alice', avatar: null, roomName: 'Smoke Room', mood: 'cosy' },
        (res) => {
          if (res.success) {
            roomStateA = res.roomState;
            resolve();
          } else {
            reject(new Error(res.error));
          }
        }
      );
    });

    assert.ok(roomStateA);
    const roomId = roomStateA.roomId;
    assert.equal(roomStateA.hostId, 'user-alice');
    assert.equal(roomStateA.members.length, 1);

    // 3. Client B connects & Joins Room
    const clientB = ClientIO(serverUrl, { reconnection: false, forceNew: true });
    await new Promise((resolve) => clientB.on('connect', resolve));

    let roomStateB = null;
    await new Promise((resolve, reject) => {
      clientB.emit(
        'join_room',
        { roomId, userId: 'user-bob', nickname: 'Bob', avatar: null },
        (res) => {
          if (res.success) {
            roomStateB = res.roomState;
            resolve();
          } else {
            reject(new Error(res.error));
          }
        }
      );
    });

    assert.ok(roomStateB);
    assert.equal(roomStateB.members.length, 2);

    // 4. A Plays new video -> B receives room_state_updated
    const bPlayPromise = new Promise((resolve) => {
      clientB.on('room_state_updated', (state) => {
        if (state.playback?.isPlaying === true && state.currentVideo?.youtubeId === 'dQw4w9WgXcQ') {
          resolve(state);
        }
      });
    });

    clientA.emit('sync_playback', {
      isPlaying: true,
      currentTime: 10,
      youtubeId: 'dQw4w9WgXcQ',
      title: 'Rick Astley'
    });

    const bReceivedPlay = await bPlayPromise;
    assert.equal(bReceivedPlay.playback.isPlaying, true);

    // 5. A Pauses video -> B receives playback_synced
    const bPausePromise = new Promise((resolve) => {
      clientB.on('playback_synced', (data) => {
        if (data.playback?.isPlaying === false) {
          resolve(data);
        }
      });
    });

    clientA.emit('sync_playback', {
      isPlaying: false,
      currentTime: 15
    });

    const bReceivedPause = await bPausePromise;
    assert.equal(bReceivedPause.playback.isPlaying, false);

    // 6. A Seeks video -> B follows
    const bSeekPromise = new Promise((resolve) => {
      clientB.on('playback_synced', (data) => {
        if (data.playback?.currentTime >= 45) {
          resolve(data);
        }
      });
    });

    clientA.emit('sync_playback', {
      isPlaying: false,
      currentTime: 45
    });

    const bReceivedSeek = await bSeekPromise;
    assert.ok(bReceivedSeek.playback.currentTime >= 45);

    // 7. B sends chat message -> A receives chat
    const aChatPromise = new Promise((resolve) => {
      clientA.on('chat_received', (msg) => {
        if (msg.text === 'Hello Alice!') {
          resolve(msg);
        }
      });
    });

    clientB.emit('send_chat', { text: 'Hello Alice!' });
    const aReceivedChat = await aChatPromise;
    assert.equal(aReceivedChat.sender, 'Bob');
    assert.equal(aReceivedChat.text, 'Hello Alice!');

    // 8. Reactions -> Both receive reaction_triggered
    const aReactionPromise = new Promise((resolve) => {
      clientA.on('reaction_triggered', (data) => {
        if (data.emoji === '❤️') resolve(data);
      });
    });

    clientB.emit('send_reaction', { emoji: '❤️' });
    const aReceivedReaction = await aReactionPromise;
    assert.equal(aReceivedReaction.emoji, '❤️');

    // 9. B refreshes / rejoins -> Reconnects smoothly
    clientB.disconnect();
    const clientB2 = ClientIO(serverUrl, { reconnection: false, forceNew: true });
    await new Promise((resolve) => clientB2.on('connect', resolve));

    let b2RejoinResult = null;
    await new Promise((resolve, reject) => {
      clientB2.emit(
        'join_room',
        { roomId, userId: 'user-bob', nickname: 'Bob', avatar: null },
        (res) => {
          if (res.success) {
            b2RejoinResult = res;
            resolve();
          } else {
            reject(new Error(res.error));
          }
        }
      );
    });

    assert.equal(b2RejoinResult.wasReconnect, true);
    assert.equal(b2RejoinResult.roomState.members.length, 2);

    // 10. A disconnects and reconnects within grace period -> Remains host
    clientA.disconnect();
    const clientA2 = ClientIO(serverUrl, { reconnection: false, forceNew: true });
    await new Promise((resolve) => clientA2.on('connect', resolve));

    let a2RejoinResult = null;
    await new Promise((resolve, reject) => {
      clientA2.emit(
        'join_room',
        { roomId, userId: 'user-alice', nickname: 'Alice', avatar: null },
        (res) => {
          if (res.success) {
            a2RejoinResult = res;
            resolve();
          } else {
            reject(new Error(res.error));
          }
        }
      );
    });

    assert.equal(a2RejoinResult.wasReconnect, true);
    assert.equal(a2RejoinResult.roomState.hostId, 'user-alice');

    // Clean up connections
    clientA2.disconnect();
    clientB2.disconnect();
  } finally {
    ioServer.close();
    await new Promise((resolve) => httpServer.close(resolve));
  }
});
