import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms, deleteRoom } from '../src/roomManager.js';

test('Playback Synchronization Test Suite', async (t) => {
  const roomId = 'SYNC01';

  // Setup room
  const host = RoomManager.createRoom('host-user-1', 'host-sock-1', 'Host Alice', null, 'Sync Test Room', 'cosy');
  host.roomId = roomId;
  rooms.delete(host.roomId);
  rooms.set(roomId, host);

  const guest = RoomManager.joinRoom(roomId, 'guest-user-2', 'guest-sock-2', 'Guest Bob', null);

  // 1. Initial play
  await t.test('1. Initial Video Load & Play Synchronization', () => {
    const res = RoomManager.updatePlayback(roomId, 'host-sock-1', {
      youtubeId: 'dQw4w9WgXcQ',
      title: 'Rick Astley',
      isPlaying: true,
      currentTime: 0
    });
    assert.equal(res.room.playback.isPlaying, true);
    assert.equal(res.room.playback.currentTime, 0);
    assert.equal(res.room.currentVideo.youtubeId, 'dQw4w9WgXcQ');
  });

  // 2. Custom Control Seek
  await t.test('2. Custom Control Seek (30s -> 60s)', () => {
    const res = RoomManager.updatePlayback(roomId, 'host-sock-1', {
      isPlaying: true,
      currentTime: 60,
      action: 'seek'
    });
    assert.equal(res.room.playback.currentTime, 60);
    assert.equal(res.room.playback.isPlaying, true);
  });

  // 3. Native YouTube Seek (e.g. Scrubber jump from 60s -> 120s)
  await t.test('3. Native YouTube Seek Detection & Server Update (60s -> 120s)', () => {
    const res = RoomManager.updatePlayback(roomId, 'host-sock-1', {
      isPlaying: true,
      currentTime: 120,
      action: 'seek'
    });
    assert.equal(res.room.playback.currentTime, 120);
    assert.equal(res.room.playback.isPlaying, true);
  });

  // 4. Seek while paused
  await t.test('4. Seek while paused (120s -> 45s, isPlaying: false)', () => {
    // First pause
    RoomManager.updatePlayback(roomId, 'host-sock-1', { isPlaying: false, currentTime: 120 });
    // Then seek
    const res = RoomManager.updatePlayback(roomId, 'host-sock-1', {
      isPlaying: false,
      currentTime: 45,
      action: 'seek'
    });
    assert.equal(res.room.playback.currentTime, 45);
    assert.equal(res.room.playback.isPlaying, false);
  });

  // 5. Rapid seek convergence
  await t.test('5. Rapid successive seeks converge to final target', () => {
    const seekTargets = [10, 25, 40, 55, 80];
    let finalRes;
    for (const target of seekTargets) {
      finalRes = RoomManager.updatePlayback(roomId, 'host-sock-1', {
        isPlaying: true,
        currentTime: target,
        action: 'seek'
      });
    }
    assert.equal(finalRes.room.playback.currentTime, 80);
    assert.equal(finalRes.room.playback.isPlaying, true);
  });

  // 6. Guest permission check
  await t.test('6. Guest playback control permission enforcement', () => {
    // Lock member controls
    RoomManager.updateRoomSettings(roomId, 'host-sock-1', { allowMemberControls: false });

    // Guest attempts seek -> Should be rejected
    const guestSeek = RoomManager.updatePlayback(roomId, 'guest-sock-2', {
      isPlaying: true,
      currentTime: 99,
      action: 'seek'
    });
    assert.equal(guestSeek?.error, 'Only the host can control playback.');
    assert.equal(rooms.get(roomId).playback.currentTime, 80); // Unchanged

    // Unlock member controls
    RoomManager.updateRoomSettings(roomId, 'host-sock-1', { allowMemberControls: true });

    // Guest attempts seek -> Should now succeed
    const guestSeekAllowed = RoomManager.updatePlayback(roomId, 'guest-sock-2', {
      isPlaying: true,
      currentTime: 99,
      action: 'seek'
    });
    assert.equal(guestSeekAllowed.room.playback.currentTime, 99);
  });

  // 7. Cleanup
  await deleteRoom(roomId);
  assert.equal(rooms.has(roomId), false);
});
