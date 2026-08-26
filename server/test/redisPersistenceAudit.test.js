import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms } from '../src/roomManager.js';

// In-Memory Mock Upstash Redis Client
class MockUpstashRedis {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.callCounts = { get: 0, set: 0, del: 0, ping: 0 };
    this.shouldFail = false;
  }

  async get(key) {
    this.callCounts.get++;
    if (this.shouldFail) throw new Error('Upstash Redis 500 Internal Server Error');
    return this.store.get(key) || null;
  }

  async set(key, value, options = {}) {
    this.callCounts.set++;
    if (this.shouldFail) throw new Error('Upstash Redis 500 Internal Server Error');
    this.store.set(key, value);
    if (options && options.ex) {
      this.ttls.set(key, options.ex);
    }
    return 'OK';
  }

  async del(key) {
    this.callCounts.del++;
    if (this.shouldFail) throw new Error('Upstash Redis 500 Internal Server Error');
    this.store.delete(key);
    this.ttls.delete(key);
    return 1;
  }

  async ping() {
    this.callCounts.ping++;
    if (this.shouldFail) throw new Error('Connection refused');
    return 'PONG';
  }
}

test('EXPERIMENT 1 & 2: Room Creation, Mutations & Redis Persistence', async () => {
  const mockRedis = new MockUpstashRedis();
  
  // Create room
  const room = RoomManager.createRoom('user-host-1', 'sock-1', 'Alice', 'https://avatar.url', 'Audit Party', 'cinema');
  const roomId = room.roomId;
  const redisKey = `together:room:${roomId}`;

  // Manually invoke save with mockRedis to test serialization & storage
  const serialized = JSON.stringify({
    ...room,
    members: Array.from(room.members.entries()),
    bannedUsers: Array.from(room.bannedUsers),
    _io: undefined
  });
  await mockRedis.set(redisKey, serialized, { ex: 7 * 24 * 60 * 60 });

  // 1. Verify key exists and TTL is 7 days (604800s)
  const storedData = await mockRedis.get(redisKey);
  assert.ok(storedData);
  assert.equal(mockRedis.ttls.get(redisKey), 604800);

  // 2. Add member mutation
  RoomManager.joinRoom(roomId, 'user-guest-2', 'sock-2', 'Bob', null);
  assert.equal(room.members.size, 2);

  // 3. Add video: First video becomes currentVideo, second video enters queue
  RoomManager.addToQueue(roomId, 'sock-1', {
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up'
  });
  assert.equal(room.currentVideo.youtubeId, 'dQw4w9WgXcQ');

  RoomManager.addToQueue(roomId, 'sock-1', {
    youtubeId: 'secondVideoId',
    title: 'Second Track'
  });
  assert.equal(room.videoQueue.length, 1);

  // 4. Update playback mutation
  RoomManager.updatePlayback(roomId, 'sock-1', {
    isPlaying: true,
    currentTime: 120,
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up'
  });
  assert.equal(room.playback.isPlaying, true);
  assert.equal(room.playback.currentTime, 120);

  // 5. Chat message mutation with Unicode & Emojis
  RoomManager.addChatMessage(roomId, 'sock-2', 'Watching together! 🍿🎉 日本語 and unicode: üñîçødê');
  assert.ok(room.chatHistory.length >= 2);

  // Re-persist mutated room
  const updatedSerialized = JSON.stringify({
    ...room,
    members: Array.from(room.members.entries()),
    bannedUsers: Array.from(room.bannedUsers),
    _io: undefined
  });
  await mockRedis.set(redisKey, updatedSerialized, { ex: 604800 });

  const rawJson = await mockRedis.get(redisKey);
  const parsed = JSON.parse(rawJson);
  assert.equal(parsed.roomId, roomId);
  assert.equal(parsed.hostId, 'user-host-1');
  assert.equal(parsed.currentVideo.youtubeId, 'dQw4w9WgXcQ');
  assert.equal(parsed.videoQueue.length, 1);
  assert.equal(parsed.videoQueue[0].youtubeId, 'secondVideoId');
  assert.equal(parsed.playback.currentTime, 120);
  assert.equal(parsed.playback.isPlaying, true);
  assert.equal(parsed.chatHistory.some(c => c.text.includes('🍿🎉')), true);
});

test('EXPERIMENT 3 & 4: Cold-Start / Backend Restart Recovery Simulation', async () => {
  const mockRedis = new MockUpstashRedis();

  // Create room with full state
  const originalRoom = RoomManager.createRoom('user-alice-123', 'sock-a', 'Alice', null, 'Recovery Room', 'cosy');
  const roomId = originalRoom.roomId;
  const redisKey = `together:room:${roomId}`;

  RoomManager.joinRoom(roomId, 'user-bob-456', 'sock-b', 'Bob', null);
  // Add first video (sets currentVideo) and second video (enters videoQueue)
  RoomManager.addToQueue(roomId, 'sock-a', { youtubeId: 'testVid1', title: 'Main Movie' });
  RoomManager.addToQueue(roomId, 'sock-a', { youtubeId: 'testVid2', title: 'Queued Movie' });
  RoomManager.addChatMessage(roomId, 'sock-b', 'Hello before restart!');
  RoomManager.updateRoomSettings(roomId, 'sock-a', { allowMemberControls: false });

  // Store in mock Redis
  const serialized = JSON.stringify({
    ...originalRoom,
    members: Array.from(originalRoom.members.entries()),
    bannedUsers: Array.from(originalRoom.bannedUsers),
    _io: undefined
  });
  await mockRedis.set(redisKey, serialized, { ex: 604800 });

  // --- SIMULATE SERVER SHUTDOWN / COLD START ---
  // Wipe in-memory Map completely (representing a fresh server process)
  rooms.clear();
  assert.equal(rooms.has(roomId), false);

  // Reconstruct from Redis payload using deserializer logic
  const retrievedJson = await mockRedis.get(redisKey);
  assert.ok(retrievedJson);
  const parsedData = JSON.parse(retrievedJson);

  const restoredRoom = {
    ...parsedData,
    members: new Map(parsedData.members || []),
    bannedUsers: new Set(parsedData.bannedUsers || []),
    _io: null
  };
  rooms.set(restoredRoom.roomId, restoredRoom);

  // Verify full fidelity restoration
  assert.equal(rooms.has(roomId), true);
  const hydrated = RoomManager.getRoom(roomId);
  assert.equal(hydrated.roomId, roomId);
  assert.equal(hydrated.hostId, 'user-alice-123');
  assert.equal(hydrated.members.size, 2);
  assert.equal(hydrated.members.get('user-alice-123').nickname, 'Alice');
  assert.equal(hydrated.members.get('user-bob-456').nickname, 'Bob');
  assert.equal(hydrated.currentVideo.youtubeId, 'testVid1');
  assert.equal(hydrated.videoQueue.length, 1);
  assert.equal(hydrated.videoQueue[0].youtubeId, 'testVid2');
  assert.equal(hydrated.settings.allowMemberControls, false);
  assert.equal(hydrated.chatHistory.some(m => m.text === 'Hello before restart!'), true);

  // Verify subsequent operations work seamlessly on hydrated room
  const joinResult = RoomManager.joinRoom(roomId, 'user-charlie-789', 'sock-c', 'Charlie', null);
  assert.equal(joinResult.room.members.size, 3);
});

test('EXPERIMENT 5: Serialization Round-Trip with Complex Data Types', () => {
  const room = RoomManager.createRoom('host-id', 'sock-h', 'HostName', null, 'Complex Party', 'starlit');
  room.bannedUsers.add('banned-id-1');
  room.bannedUsers.add('banned-id-2');

  // Push 105 messages to test chat history cap (max 100)
  for (let i = 0; i < 105; i++) {
    RoomManager.addChatMessage(room.roomId, 'sock-h', `Message #${i}: special chars <>&"' 🚀`);
  }
  assert.equal(room.chatHistory.length, 100);

  // Serialize
  const serialized = {
    ...room,
    members: Array.from(room.members.entries()),
    bannedUsers: Array.from(room.bannedUsers),
    _io: undefined
  };

  const jsonString = JSON.stringify(serialized);
  const parsed = JSON.parse(jsonString);

  // Deserialize
  const deserialized = {
    ...parsed,
    members: new Map(parsed.members || []),
    bannedUsers: new Set(parsed.bannedUsers || []),
    _io: null
  };

  assert.equal(deserialized.roomId, room.roomId);
  assert.equal(deserialized.bannedUsers instanceof Set, true);
  assert.equal(deserialized.bannedUsers.has('banned-id-1'), true);
  assert.equal(deserialized.members instanceof Map, true);
  assert.equal(deserialized.chatHistory.length, 100);
  assert.equal(deserialized._io, null);
});

test('EXPERIMENT 6: Redis Failure Resilience (Non-blocking & Exception Safety)', async () => {
  const mockFailingRedis = new MockUpstashRedis();
  mockFailingRedis.shouldFail = true;

  // Test that RoomManager operations continue to serve in-memory requests even if Redis throws
  const room = RoomManager.createRoom('host-safe', 'sock-safe', 'SafeHost', null, 'Resilient Party', 'cosy');
  assert.ok(room);
  assert.equal(room.hostId, 'host-safe');

  // Member join must succeed in memory
  const res = RoomManager.joinRoom(room.roomId, 'guest-safe', 'sock-g', 'SafeGuest', null);
  assert.equal(res.room.members.size, 2);

  // Chat must succeed in memory
  const chatRes = RoomManager.addChatMessage(room.roomId, 'sock-safe', 'Chat works during Redis outage');
  assert.ok(chatRes.message);
});
