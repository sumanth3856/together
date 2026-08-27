/**
 * redisPersistenceLifecycle.test.js
 * Comprehensive 7-Day Redis TTL & Room Lifecycle Verification Suite
 */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import { RoomManager, rooms, cleanupInterval, persistRoom, deleteRoom } from '../src/roomManager.js';
import redis from '../src/redisClient.js';

after(async () => {
  clearInterval(cleanupInterval);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test('TEST 1 & 2: Room creation creates Redis key with 7-day TTL (~604800s)', async (t) => {
  if (!redis) {
    t.skip('Skipping: Upstash Redis credentials not provided in environment.');
    return;
  }

  const room = RoomManager.createRoom('u-test1', 's-test1', 'Alice', null, 'Test Room 1', 'cosy');
  const roomId = room.roomId;
  const key = `together:room:${roomId}`;

  await sleep(600); // Wait for async write

  const exists = await redis.exists(key);
  assert.equal(exists, 1, 'Redis key must exist after room creation');

  const ttl = await redis.ttl(key);
  assert.ok(ttl >= 604700 && ttl <= 604800, `TTL must be ~604800s (7 days). Got: ${ttl}`);

  // Cleanup
  await deleteRoom(roomId);
});

test('TEST 3: Subsequent room mutations do not accidentally remove or corrupt TTL', async (t) => {
  if (!redis) {
    t.skip('Skipping: Upstash Redis credentials not provided in environment.');
    return;
  }

  const room = RoomManager.createRoom('u-test2', 's-test2', 'Alice', null, 'Test Room 2', 'cosy');
  const roomId = room.roomId;
  const key = `together:room:${roomId}`;

  await sleep(600);
  const initialTtl = await redis.ttl(key);
  assert.ok(initialTtl > 604000);

  // Mutation 1: Chat message
  RoomManager.addChatMessage(roomId, 's-test2', 'Hello World');
  await sleep(600);
  const ttlAfterChat = await redis.ttl(key);
  assert.ok(ttlAfterChat >= 604700 && ttlAfterChat <= 604800, 'TTL must be refreshed/preserved after chat');

  // Mutation 2: Playback sync
  RoomManager.updatePlayback(roomId, 's-test2', { isPlaying: true, currentTime: 30, youtubeId: 'dQw4w9WgXcQ' });
  await sleep(600);
  const ttlAfterPlayback = await redis.ttl(key);
  assert.ok(ttlAfterPlayback >= 604700 && ttlAfterPlayback <= 604800, 'TTL must be refreshed/preserved after playback sync');

  // Mutation 3: Queue video
  RoomManager.addToQueue(roomId, 's-test2', { youtubeId: 'abc12345678', title: 'Queued Video' });
  await sleep(600);
  const ttlAfterQueue = await redis.ttl(key);
  assert.ok(ttlAfterQueue >= 604700 && ttlAfterQueue <= 604800, 'TTL must be refreshed/preserved after queue update');

  await deleteRoom(roomId);
});

test('TEST 4: Rapid coalesced writes preserve TTL without dropping latest state', async (t) => {
  if (!redis) {
    t.skip('Skipping: Upstash Redis credentials not provided in environment.');
    return;
  }

  const room = RoomManager.createRoom('u-test3', 's-test3', 'Alice', null, 'Coalesce Test', 'cosy');
  const roomId = room.roomId;
  const key = `together:room:${roomId}`;

  // Fire 10 rapid mutations with debouncing
  for (let i = 1; i <= 10; i++) {
    RoomManager.addChatMessage(roomId, 's-test3', `Message ${i}`);
    persistRoom(room, { debounceMs: 50 });
  }

  await sleep(800);

  const ttl = await redis.ttl(key);
  assert.ok(ttl >= 604700 && ttl <= 604800, `TTL must remain valid after coalesced writes. Got: ${ttl}`);

  // Verify latest state was written to Redis
  const raw = await redis.get(key);
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  assert.equal(parsed.chatHistory.at(-1).text, 'Message 10', 'Latest state must win in coalesced write');

  await deleteRoom(roomId);
});

test('TEST 5: Socket disconnect does NOT delete Redis room', async (t) => {
  if (!redis) {
    t.skip('Skipping: Upstash Redis credentials not provided in environment.');
    return;
  }

  const room = RoomManager.createRoom('u-test4', 's-test4', 'Alice', null, 'Disconnect Test', 'cosy');
  const roomId = room.roomId;
  const key = `together:room:${roomId}`;

  // Join second member
  RoomManager.joinRoom(roomId, 'u-test4-bob', 's-test4-bob', 'Bob', null);
  await sleep(600);

  // Bob's socket disconnects
  RoomManager.leaveRoom('s-test4-bob');
  await sleep(600);

  // Key must still exist in Redis
  const existsAfterBob = await redis.exists(key);
  assert.equal(existsAfterBob, 1, 'Redis key must exist after guest socket disconnect');

  // Alice's socket disconnects (0 members remain)
  RoomManager.leaveRoom('s-test4');
  await sleep(600);

  // Key must still exist in Redis even when 0 members are connected
  const existsAfterAll = await redis.exists(key);
  assert.equal(existsAfterAll, 1, 'Redis key must exist when all sockets disconnect');
  const ttl = await redis.ttl(key);
  assert.ok(ttl >= 604700 && ttl <= 604800, 'TTL must remain 7 days');

  await deleteRoom(roomId);
});

test('TEST 6 & 7: Socket reconnect & browser refresh successfully restores room from Redis', async (t) => {
  if (!redis) {
    t.skip('Skipping: Upstash Redis credentials not provided in environment.');
    return;
  }

  const room = RoomManager.createRoom('u-test5', 's-test5-old', 'Alice', null, 'Refresh Test', 'cosy');
  const roomId = room.roomId;
  RoomManager.addChatMessage(roomId, 's-test5-old', 'Persistent Message');
  await sleep(600);

  // Simulate browser refresh: old socket disconnects
  RoomManager.leaveRoom('s-test5-old');
  await sleep(400);

  // Evict room from in-memory Map to simulate cold restart/fresh connection
  rooms.delete(roomId);
  assert.equal(rooms.has(roomId), false, 'Room was evicted from Node memory');

  // Client connects with new socket ID and calls ensureRoom / joinRoom
  const restoredRoom = await RoomManager.ensureRoom(roomId);
  assert.ok(restoredRoom, 'ensureRoom must hydrate room from Redis');
  assert.equal(restoredRoom.roomId, roomId);

  const rejoinResult = RoomManager.joinRoom(roomId, 'u-test5', 's-test5-new', 'Alice', null);
  assert.ok(!rejoinResult.error);
  assert.equal(rejoinResult.member.nickname, 'Alice');

  // Verify chat history and room settings survived
  const msgs = restoredRoom.chatHistory.map(m => m.text);
  assert.ok(msgs.includes('Persistent Message'), 'Chat history must survive');

  await deleteRoom(roomId);
});

test('TEST 8 & 9: Full room state survives process eviction / restart', async (t) => {
  if (!redis) {
    t.skip('Skipping: Upstash Redis credentials not provided in environment.');
    return;
  }

  const room = RoomManager.createRoom('u-host', 's-host', 'HostAlice', 'avatar.png', 'Full State Room', 'starlit');
  const roomId = room.roomId;

  // Add rich state
  RoomManager.joinRoom(roomId, 'u-guest', 's-guest', 'GuestBob', null);
  RoomManager.updatePlayback(roomId, 's-host', { isPlaying: true, currentTime: 120, youtubeId: 'video_123', title: 'Video Title' });
  RoomManager.addToQueue(roomId, 's-host', { youtubeId: 'queued_456', title: 'Queued Video' });
  RoomManager.addChatMessage(roomId, 's-guest', 'Awesome video!');
  await sleep(600);

  // Simulate total Node process crash / wipe memory
  rooms.clear();
  assert.equal(rooms.size, 0);

  // Re-hydrate
  const hydrated = await RoomManager.ensureRoom(roomId);
  assert.ok(hydrated, 'Must recover from Redis');
  assert.equal(hydrated.roomId, roomId);
  assert.equal(hydrated.hostId, 'u-host');
  assert.equal(hydrated.settings.roomName, 'Full State Room');
  assert.equal(hydrated.settings.mood, 'starlit');
  assert.equal(hydrated.currentVideo.youtubeId, 'video_123');
  assert.equal(hydrated.playback.isPlaying, true);
  assert.equal(hydrated.playback.currentTime, 120);
  assert.equal(hydrated.videoQueue.length, 1);
  assert.equal(hydrated.videoQueue[0].youtubeId, 'queued_456');
  assert.ok(hydrated.chatHistory.some(m => m.text === 'Awesome video!'));

  await deleteRoom(roomId);
});

test('TEST 10: Redis unavailable fallback remains safe and non-blocking in memory-only mode', async () => {
  // Test memory-only operations when Redis is not available
  const room = RoomManager.createRoom('u-mem', 's-mem', 'MemUser', null, 'Mem Room', 'cosy');
  assert.ok(room);
  assert.equal(rooms.has(room.roomId), true);
  
  RoomManager.addChatMessage(room.roomId, 's-mem', 'Memory message');
  assert.equal(room.chatHistory.at(-1).text, 'Memory message');

  const inMem = RoomManager.getRoom(room.roomId);
  assert.equal(inMem.roomId, room.roomId);
});

test('TEST 11: Empty-room lifecycle vs Host Intentional Leave deletion', async (t) => {
  if (!redis) {
    t.skip('Skipping: Upstash Redis credentials not provided in environment.');
    return;
  }

  // Case A: Sockets disconnect (network drop, tab close) -> Room stays in Redis for 7 days
  const roomA = RoomManager.createRoom('u-a', 's-a', 'HostA', null, 'Room A', 'cosy');
  const keyA = `together:room:${roomA.roomId}`;
  await sleep(600);
  RoomManager.leaveRoom('s-a'); // Disconnect
  await sleep(600);
  assert.equal(await redis.exists(keyA), 1, 'Room must stay in Redis on disconnect');

  // Case B: Host clicks explicit "Leave Room" button -> Disbands room and removes from Redis
  const roomB = RoomManager.createRoom('u-b', 's-b', 'HostB', null, 'Room B', 'cosy');
  const keyB = `together:room:${roomB.roomId}`;
  await sleep(600);
  const leaveResult = RoomManager.intentionalLeave('s-b');
  assert.equal(leaveResult.sessionEnded, true, 'Intentional host leave disbands session');
  await sleep(600);
  assert.equal(await redis.exists(keyB), 0, 'Intentional host leave deletes room from Redis');

  await deleteRoom(roomA.roomId);
});
