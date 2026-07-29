/**
 * roomManager.test.js
 * Node built-in test runner — no extra deps required.
 * Run with: node --test test/roomManager.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms } from '../src/roomManager.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Wipe all in-memory rooms between tests to prevent bleed-over */
function clearRooms() {
  rooms.clear();
}

// ─── Suite 1: createRoom ────────────────────────────────────────────────────

test('createRoom — initialises a room correctly', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-1', 'Alice');

  assert.ok(room.roomId.startsWith('TOG-'), 'roomId must be prefixed TOG-');
  assert.equal(room.roomId.length, 8, 'roomId must be 8 chars (TOG-XXXX)');
  assert.equal(room.members.size, 1, 'should have exactly 1 member after creation');

  const host = room.members.get('s-1');
  assert.equal(host.nickname, 'Alice');
  assert.equal(host.socketId, 's-1');
  assert.ok(host.color, 'member should have a colour');

  // Egalitarian model: no isHost / hasControl fields
  assert.equal(host.isHost, undefined, 'isHost field should NOT exist in egalitarian model');
  assert.equal(host.hasControl, undefined, 'hasControl field should NOT exist');

  // Default video & playback
  assert.ok(room.currentVideo.youtubeId, 'default video should be set');
  assert.equal(room.playback.isPlaying, false, 'should start paused');
  assert.equal(room.playback.currentTime, 0, 'should start at time 0');

  // System welcome message
  assert.equal(room.chatHistory.length, 1);
  assert.ok(room.chatHistory[0].isSystem);
});

// ─── Suite 2: getRoom ───────────────────────────────────────────────────────

test('getRoom — resolves normalised room codes', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-2', 'Bob');
  const code = room.roomId; // e.g. TOG-AB12

  // Exact match
  assert.equal(RoomManager.getRoom(code)?.roomId, code);

  // Just the 4-char suffix
  const shortCode = code.replace('TOG-', '');
  assert.equal(RoomManager.getRoom(shortCode)?.roomId, code, '4-char code should resolve');

  // Without dash: TOG + XXXX
  const noDash = `TOG${shortCode}`;
  assert.equal(RoomManager.getRoom(noDash)?.roomId, code, 'TOG+4 without dash should resolve');

  // Non-existent room
  assert.equal(RoomManager.getRoom('TOG-9999'), null, 'missing room should return null');
  assert.equal(RoomManager.getRoom(null), null, 'null input should return null');
});

// ─── Suite 3: joinRoom ──────────────────────────────────────────────────────

test('joinRoom — fresh join adds member', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-3', 'Host');
  const result = RoomManager.joinRoom(room.roomId, 's-4', 'Charlie');

  assert.ok(!result.error, 'should not return an error');
  assert.equal(result.room.members.size, 2, 'should have 2 members after join');
  assert.equal(result.member.nickname, 'Charlie');
  assert.equal(result.wasReconnect, false, 'first join should NOT be flagged as reconnect');

  // System chat message added
  const lastMsg = result.room.chatHistory.at(-1);
  assert.ok(lastMsg.isSystem);
  assert.ok(lastMsg.text.includes('Charlie'));
});

test('joinRoom — returns error for non-existent room', (t) => {
  clearRooms();
  const result = RoomManager.joinRoom('TOG-ZZZZ', 's-5', 'Dan');
  assert.equal(result.error, 'Room not found');
});

test('joinRoom — ejecting ghost (rapid reload scenario)', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-6', 'Host');
  RoomManager.joinRoom(room.roomId, 's-7', 'Ghost');

  // Ghost is still in the room map (simulating a rapid reload before disconnect fires)
  assert.equal(room.members.has('s-7'), true);

  // New socket with same nickname reconnects without going through pendingReconnects
  const result = RoomManager.joinRoom(room.roomId, 's-8', 'Ghost');
  assert.ok(!result.error);
  assert.equal(room.members.has('s-7'), false, 'ghost socket should be ejected');
  assert.equal(room.members.has('s-8'), true, 'new socket should be in the room');
});

// ─── Suite 4: leaveRoom (grace-period disconnect) ──────────────────────────

test('leaveRoom — removes member and adds system message', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-9', 'Host');
  RoomManager.joinRoom(room.roomId, 's-10', 'Guest');

  const result = RoomManager.leaveRoom('s-10');
  assert.ok(result, 'should return a result');
  assert.equal(result.roomId, room.roomId);
  assert.equal(result.sessionEnded, false, 'room should NOT be disbanded when host is still present');

  // Member removed immediately from room map
  assert.equal(room.members.has('s-10'), false);

  const lastMsg = room.chatHistory.at(-1);
  assert.ok(lastMsg.isSystem);
  assert.ok(lastMsg.text.includes('disconnected'));
});

test('leaveRoom — does NOT immediately disband room (grace period)', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-11', 'Solo');
  const roomId = room.roomId;

  RoomManager.leaveRoom('s-11');

  // Room should still exist during the grace period (30 seconds haven't elapsed)
  assert.ok(rooms.has(roomId), 'room should still exist during grace period');
});

// ─── Suite 5: intentionalLeave ──────────────────────────────────────────────

test('intentionalLeave — last member disbands room immediately', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-12', 'Solo');
  const roomId = room.roomId;

  const result = RoomManager.intentionalLeave('s-12');
  assert.equal(result.sessionEnded, true);
  assert.equal(rooms.has(roomId), false, 'room should be deleted immediately');
});

test('intentionalLeave — non-last member adds chat message', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-13', 'Host');
  RoomManager.joinRoom(room.roomId, 's-14', 'Guest');

  const result = RoomManager.intentionalLeave('s-14');
  assert.equal(result.sessionEnded, false);
  assert.equal(rooms.has(room.roomId), true, 'room should persist');

  const lastMsg = room.chatHistory.at(-1);
  assert.ok(lastMsg.isSystem);
  assert.ok(lastMsg.text.includes('left the room'));
});

// ─── Suite 6: updatePlayback ────────────────────────────────────────────────

test('updatePlayback — any member can control playback (egalitarian)', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-15', 'Host');
  RoomManager.joinRoom(room.roomId, 's-16', 'Guest');

  // Guest controls playback — should NOT be blocked
  const result = RoomManager.updatePlayback(room.roomId, 's-16', { isPlaying: true, currentTime: 42 });
  assert.ok(!result.error, 'egalitarian model: guest should be allowed to update playback');
  assert.equal(result.room.playback.isPlaying, true);
  assert.equal(result.room.playback.currentTime, 42);
});

test('updatePlayback — loading a new video updates currentVideo', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-17', 'Host');

  const result = RoomManager.updatePlayback(room.roomId, 's-17', {
    youtubeId: 'abc12345678',
    title: 'Test Video',
    isPlaying: true,
    currentTime: 0
  });

  assert.ok(!result.error);
  assert.equal(result.room.currentVideo.youtubeId, 'abc12345678');
  assert.equal(result.room.currentVideo.title, 'Test Video');

  // System message about video change
  const lastMsg = result.room.chatHistory.at(-1);
  assert.ok(lastMsg.isSystem);
  assert.ok(lastMsg.text.includes('changed the video'));
});

test('updatePlayback — same youtubeId does NOT add duplicate system message', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-18', 'Host');
  const initialCount = room.chatHistory.length;

  // Seek to a new time on the same video
  const result = RoomManager.updatePlayback(room.roomId, 's-18', {
    youtubeId: room.currentVideo.youtubeId,
    isPlaying: false,
    currentTime: 30
  });

  assert.equal(result.room.chatHistory.length, initialCount, 'same video should not add a system message');
  assert.equal(result.room.playback.currentTime, 30);
});

test('updatePlayback — returns null for unknown room', (t) => {
  clearRooms();
  const result = RoomManager.updatePlayback('TOG-ZZZZ', 's-19', { isPlaying: true });
  assert.equal(result, null);
});

// ─── Suite 7: addChatMessage ────────────────────────────────────────────────

test('addChatMessage — adds a message for a valid member', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-20', 'Host');
  const result = RoomManager.addChatMessage(room.roomId, 's-20', 'Hello!');

  assert.ok(result, 'should return a result');
  assert.equal(result.message.text, 'Hello!');
  assert.equal(result.message.sender, 'Host');
  assert.equal(result.message.isSystem, false);
  assert.ok(result.message.id.startsWith('msg-'));
  assert.ok(result.message.color, 'message should carry sender colour');
});

test('addChatMessage — trims whitespace and respects 100-msg cap', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-21', 'Host');

  for (let i = 0; i < 110; i++) {
    RoomManager.addChatMessage(room.roomId, 's-21', `msg ${i}`);
  }

  assert.ok(room.chatHistory.length <= 100, 'chat history should be capped at 100');
});

test('addChatMessage — returns null for unknown user', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-22', 'Host');
  const result = RoomManager.addChatMessage(room.roomId, 'GHOST', 'hi');
  assert.equal(result, null, 'unknown socket should return null');
});

// ─── Suite 8: getRoomStateDTO ────────────────────────────────────────────────

test('getRoomStateDTO — returns serialisable DTO (no Maps)', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-23', 'Host');
  const dto = RoomManager.getRoomStateDTO(room);

  assert.ok(Array.isArray(dto.members), 'members should be an Array in the DTO');
  assert.equal(dto.roomId, room.roomId);
  assert.ok(typeof dto.playback.currentTime === 'number');
});

test('getRoomStateDTO — live interpolates currentTime while playing', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-24', 'Host');

  // Manually set playback to playing, 50 seconds ago
  room.playback.isPlaying = true;
  room.playback.currentTime = 100;
  room.playback.updatedAt = Date.now() - 5000; // 5 seconds ago

  const dto = RoomManager.getRoomStateDTO(room);
  assert.ok(dto.playback.currentTime >= 105, 'time should be interpolated forward when playing');
});

test('getRoomStateDTO — does NOT interpolate when paused', (t) => {
  clearRooms();
  const room = RoomManager.createRoom('s-25', 'Host');

  room.playback.isPlaying = false;
  room.playback.currentTime = 50;
  room.playback.updatedAt = Date.now() - 10000; // 10 seconds ago

  const dto = RoomManager.getRoomStateDTO(room);
  assert.equal(dto.playback.currentTime, 50, 'paused time should NOT change');
});

test('getRoomStateDTO — returns null for null room', (t) => {
  assert.equal(RoomManager.getRoomStateDTO(null), null);
});
