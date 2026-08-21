import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms } from '../src/roomManager.js';

function clearRooms() {
  rooms.clear();
}

test('addToQueue - adds video to queue', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('host', 's1', 'Host', null);
  // Ensure default video is loaded so it adds to queue
  RoomManager.updatePlayback(room.roomId, 's1', { youtubeId: 'init', title: 'Init' });
  const result = RoomManager.addToQueue(room.roomId, 's1', { youtubeId: '123', title: 'Vid' });
  assert.equal(result.room.videoQueue.length, 1);
  assert.equal(result.room.videoQueue[0].youtubeId, '123');
});

test('removeFromQueue - host can remove', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('host', 's1', 'Host', null);
  RoomManager.updatePlayback(room.roomId, 's1', { youtubeId: 'init', title: 'Init' });
  RoomManager.addToQueue(room.roomId, 's1', { youtubeId: '123', title: 'Vid' });
  const queueId = room.videoQueue[0].id;
  const result = RoomManager.removeFromQueue(room.roomId, 's1', queueId);
  assert.equal(result.room.videoQueue.length, 0);
});

test('removeFromQueue - non-host gets error', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('host', 's1', 'Host', null);
  room.settings.allowMemberControls = false; // Disallow member controls to test host check
  RoomManager.joinRoom(room.roomId, 'user2', 's2', 'User 2', null);
  RoomManager.updatePlayback(room.roomId, 's1', { youtubeId: 'init', title: 'Init' });
  RoomManager.addToQueue(room.roomId, 's1', { youtubeId: '123', title: 'Vid' });
  const queueId = room.videoQueue[0].id;
  const result = RoomManager.removeFromQueue(room.roomId, 's2', queueId);
  assert.equal(result.error, 'Only the host can modify the queue.');
});

test('playNext - shifts queue to current video', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('host', 's1', 'Host', null);
  RoomManager.updatePlayback(room.roomId, 's1', { youtubeId: 'init', title: 'Init' });
  RoomManager.addToQueue(room.roomId, 's1', { youtubeId: '123', title: 'Vid' });
  const result = RoomManager.playNext(room.roomId, 's1');
  assert.equal(result.room.currentVideo.youtubeId, '123');
  assert.equal(result.room.videoQueue.length, 0);
  assert.equal(result.room.playback.isPlaying, true);
});

test('kickUser - host can kick user', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('host', 's1', 'Host', null);
  RoomManager.joinRoom(room.roomId, 'user2', 's2', 'User 2', null);
  const result = RoomManager.kickUser(room.roomId, 's1', 'user2');
  assert.ok(result.room);
  assert.equal(result.kickedSocketIds.includes('s2'), true);
  assert.equal(result.room.members.has('user2'), false);
  assert.equal(result.room.bannedUsers.has('user2'), true);
});

test('kickUser - non-host gets error', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('host', 's1', 'Host', null);
  RoomManager.joinRoom(room.roomId, 'user2', 's2', 'User 2', null);
  RoomManager.joinRoom(room.roomId, 'user3', 's3', 'User 3', null);
  const result = RoomManager.kickUser(room.roomId, 's2', 'user3');
  assert.equal(result.error, 'Only the host can kick users.');
});

test('transferHost - host can transfer', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('host', 's1', 'Host', null);
  RoomManager.joinRoom(room.roomId, 'user2', 's2', 'User 2', null);
  const result = RoomManager.transferHost(room.roomId, 's1', 'user2');
  assert.equal(result.room.hostId, 'user2');
});
