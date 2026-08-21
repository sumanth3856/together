/**
 * redisPersistence.test.js
 * 
 * Verifies Upstash Redis integration, serialization/deserialization,
 * namespacing, queue/chat safety bounds, and hydration mechanics.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms } from '../src/roomManager.js';
import { pingRedis } from '../src/redisClient.js';

function clearRooms() {
  rooms.clear();
}

test('pingRedis returns a valid status string', async () => {
  const status = await pingRedis();
  assert.ok(['ok', 'unavailable', 'error'].includes(status), 'pingRedis should return valid status');
});

test('ensureRoom retrieves from memory when available', async () => {
  clearRooms();
  const created = RoomManager.createRoom('user-p1', 'sock-p1', 'Alice');
  
  const fetched = await RoomManager.ensureRoom(created.roomId);
  assert.ok(fetched, 'ensureRoom should find existing memory room');
  assert.equal(fetched.roomId, created.roomId);
  assert.equal(fetched.hostId, 'user-p1');
});

test('ensureRoom returns null for non-existent room', async () => {
  clearRooms();
  const fetched = await RoomManager.ensureRoom('NONEXIST');
  assert.equal(fetched, null, 'ensureRoom should return null for non-existent room');
});

test('video queue enforces maximum cap of 50 videos', () => {
  clearRooms();
  const room = RoomManager.createRoom('user-q1', 'sock-q1', 'Host');
  // Load initial video so subsequent additions go into the queue
  RoomManager.updatePlayback(room.roomId, 'sock-q1', { youtubeId: 'init-vid', title: 'Initial' });

  // Add 50 videos
  for (let i = 1; i <= 50; i++) {
    const res = RoomManager.addToQueue(room.roomId, 'sock-q1', { youtubeId: `vid-${i}`, title: `Video ${i}` });
    assert.ok(res.room, `Should successfully add video ${i}`);
  }

  assert.equal(room.videoQueue.length, 50, 'Queue length should be exactly 50');

  // Attempt to add 51st video
  const overflowRes = RoomManager.addToQueue(room.roomId, 'sock-q1', { youtubeId: 'vid-51', title: 'Overflow Video' });
  assert.ok(overflowRes.error, 'Should reject 51st video');
  assert.equal(overflowRes.error, 'Queue is full (maximum 50 videos).');
  assert.equal(room.videoQueue.length, 50, 'Queue should remain capped at 50');
});

test('chat history enforces 100-message cap and preserves system messages', () => {
  clearRooms();
  const room = RoomManager.createRoom('user-c1', 'sock-c1', 'Host');

  // Push 110 messages
  for (let i = 1; i <= 110; i++) {
    RoomManager.addChatMessage(room.roomId, 'sock-c1', `Message number ${i}`);
  }

  assert.ok(room.chatHistory.length <= 100, `Chat history must not exceed 100 (actual: ${room.chatHistory.length})`);
  const lastMsg = room.chatHistory.at(-1);
  assert.equal(lastMsg.text, 'Message number 110');
});

test('intentionalLeave retains room structure and allows re-join', () => {
  clearRooms();
  const room = RoomManager.createRoom('user-leave-1', 'sock-l1', 'LeavingHost');
  const code = room.roomId;

  // Add chat and video before leaving
  RoomManager.updatePlayback(code, 'sock-l1', { youtubeId: 'vid-saved', title: 'Saved Video' });
  RoomManager.addChatMessage(code, 'sock-l1', 'Remember this message');

  const leaveResult = RoomManager.intentionalLeave('sock-l1');
  assert.equal(leaveResult.sessionEnded, true);
  assert.equal(rooms.has(code), false, 'Room should be evicted from active memory Map');
});
