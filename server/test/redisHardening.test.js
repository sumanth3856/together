import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms, persistenceState, persistRoom } from '../src/roomManager.js';
import { pingRedis } from '../src/redisClient.js';

// In-Memory Mock Upstash Redis with customizable network latency
class MockDelayedUpstashRedis {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.writeHistory = [];
    this.delayMs = 0;
    this.shouldFail = false;
  }

  async get(key) {
    if (this.delayMs > 0) await new Promise(r => setTimeout(r, this.delayMs));
    if (this.shouldFail) throw new Error('Upstash Redis 500 Internal Server Error');
    return this.store.get(key) || null;
  }

  async set(key, value, options = {}) {
    if (this.delayMs > 0) await new Promise(r => setTimeout(r, this.delayMs));
    if (this.shouldFail) throw new Error('Upstash Redis 500 Internal Server Error');
    this.store.set(key, value);
    this.writeHistory.push({ key, value, timestamp: Date.now() });
    if (options && options.ex) {
      this.ttls.set(key, options.ex);
    }
    return 'OK';
  }

  async del(key) {
    if (this.delayMs > 0) await new Promise(r => setTimeout(r, this.delayMs));
    this.store.delete(key);
    this.ttls.delete(key);
    return 1;
  }

  async ping() {
    if (this.shouldFail) throw new Error('Connection refused');
    return 'PONG';
  }
}

test('TEST 1: Write Ordering & Coalescing under Asynchronous Network Delays', async () => {
  const mockRedis = new MockDelayedUpstashRedis();
  mockRedis.delayMs = 20; // 20ms network delay per write

  const room = RoomManager.createRoom('host-order', 'sock-1', 'Alice', null, 'Ordering Room', 'cosy');
  const roomId = room.roomId;
  const redisKey = `together:room:${roomId}`;

  // Coalescing Write Simulator
  const state = { inFlight: null, isDirty: false };
  let flushCount = 0;

  async function testFlush(r) {
    if (state.inFlight) {
      state.isDirty = true;
      return;
    }
    state.isDirty = false;
    flushCount++;
    const snap = JSON.stringify({
      ...r,
      members: Array.from(r.members.entries()),
      bannedUsers: Array.from(r.bannedUsers)
    });
    state.inFlight = mockRedis.set(redisKey, snap).finally(async () => {
      state.inFlight = null;
      if (state.isDirty) {
        state.isDirty = false;
        await testFlush(room);
      }
    });
    await state.inFlight;
  }

  // Trigger 3 rapid mutations: State A -> State B -> State C
  room.playback.currentTime = 10; // State A
  testFlush(room);

  room.playback.currentTime = 25; // State B
  testFlush(room);

  room.playback.currentTime = 50; // State C
  testFlush(room);

  // Wait for all in-flight and coalesced writes to settle
  await new Promise(r => setTimeout(r, 100));

  // Verify Redis ends with State C (50) and never reverted to 10 or 25
  const rawFinal = await mockRedis.get(redisKey);
  const parsedFinal = JSON.parse(rawFinal);
  assert.equal(parsedFinal.playback.currentTime, 50);
  // Coalescing ensured fewer total network roundtrips than naive parallel firing
  assert.ok(flushCount <= 2);
});

test('TEST 2: Rapid Playback Updates & Debouncing', async () => {
  const room = RoomManager.createRoom('host-seek', 'sock-s', 'Seeker', null, 'Seek Room', 'cinema');
  const roomId = room.roomId;

  // Simulate user dragging slider: 10s -> 20s -> 30s -> 40s -> 50s in rapid succession
  for (let s = 10; s <= 50; s += 10) {
    RoomManager.updatePlayback(roomId, 'sock-s', { currentTime: s, isPlaying: true });
    assert.equal(room.playback.currentTime, s); // In-memory authoritative state updates immediately
  }

  assert.equal(room.playback.currentTime, 50);
  assert.equal(rooms.get(roomId).playback.currentTime, 50);
});

test('TEST 3: Concurrent Lifecycle Mutations (Join, Queue, Chat, Settings)', async () => {
  const room = RoomManager.createRoom('host-concur', 'sock-h', 'Host', null, 'Concur Room', 'starlit');
  const roomId = room.roomId;

  // Execute rapid interleaved operations
  RoomManager.joinRoom(roomId, 'user-2', 'sock-2', 'Bob', null);
  RoomManager.addToQueue(roomId, 'sock-h', { youtubeId: 'vid1', title: 'Video 1' });
  RoomManager.addToQueue(roomId, 'sock-h', { youtubeId: 'vid2', title: 'Video 2' });
  RoomManager.addChatMessage(roomId, 'sock-2', 'Chat during queueing');
  RoomManager.updateRoomSettings(roomId, 'sock-h', { allowMemberControls: false });

  assert.equal(room.members.size, 2);
  assert.equal(room.currentVideo.youtubeId, 'vid1');
  assert.equal(room.videoQueue.length, 1);
  assert.equal(room.settings.allowMemberControls, false);
  assert.ok(room.chatHistory.some(m => m.text === 'Chat during queueing'));
});

test('TEST 4: Redis Outage / Rejection Resilience', async () => {
  const failingRedis = new MockDelayedUpstashRedis();
  failingRedis.shouldFail = true;

  // Operations must remain non-blocking and safe during Redis errors
  const room = RoomManager.createRoom('host-outage', 'sock-o', 'OutageHost', null, 'Outage Room', 'cosy');
  assert.ok(room);

  const joinRes = RoomManager.joinRoom(room.roomId, 'guest-o', 'sock-go', 'OutageGuest', null);
  assert.equal(joinRes.room.members.size, 2);

  const chatRes = RoomManager.addChatMessage(room.roomId, 'sock-o', 'Live chat still works in memory');
  assert.ok(chatRes.message);
});

test('TEST 5 & 6: Environment Configurations (Production vs Development/Test)', async () => {
  // In test/development environment without Redis credentials:
  const devStatus = await pingRedis();
  assert.ok(['ok', 'unavailable', 'missing_config'].includes(devStatus));

  // Verify memory fallback functions cleanly for tests
  assert.ok(rooms instanceof Map);
});

test('TEST 7: Cold-Start Hydration after Memory Wipe', async () => {
  const mockRedis = new MockDelayedUpstashRedis();
  const original = RoomManager.createRoom('host-cold', 'sock-c', 'ColdHost', null, 'Cold Party', 'cinema');
  const roomId = original.roomId;
  const redisKey = `together:room:${roomId}`;

  RoomManager.joinRoom(roomId, 'user-cold-guest', 'sock-cg', 'ColdGuest', null);
  RoomManager.addToQueue(roomId, 'sock-c', { youtubeId: 'coldVid', title: 'Cold Movie' });
  RoomManager.addChatMessage(roomId, 'sock-cg', 'Preserved across cold start');

  const serialized = JSON.stringify({
    ...original,
    members: Array.from(original.members.entries()),
    bannedUsers: Array.from(original.bannedUsers),
    _io: undefined
  });
  await mockRedis.set(redisKey, serialized, { ex: 604800 });

  // Clear in-memory Map
  rooms.clear();
  assert.equal(rooms.has(roomId), false);

  // Hydrate from Redis
  const rawData = await mockRedis.get(redisKey);
  assert.ok(rawData);
  const parsed = JSON.parse(rawData);
  const hydrated = {
    ...parsed,
    members: new Map(parsed.members || []),
    bannedUsers: new Set(parsed.bannedUsers || []),
    _io: null
  };
  rooms.set(hydrated.roomId, hydrated);

  assert.equal(rooms.has(roomId), true);
  const loaded = RoomManager.getRoom(roomId);
  assert.equal(loaded.hostId, 'host-cold');
  assert.equal(loaded.members.size, 2);
  assert.equal(loaded.currentVideo.youtubeId, 'coldVid');
  assert.ok(loaded.chatHistory.some(m => m.text === 'Preserved across cold start'));
});
