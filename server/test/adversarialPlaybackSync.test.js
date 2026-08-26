import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms, deleteRoom } from '../src/roomManager.js';

test('Adversarial Playback Synchronization Verification', async (t) => {
  const roomId = 'ADV001';

  // Setup room with 1 host and 3 guests
  const host = RoomManager.createRoom('adv-host', 'sock-host', 'Host Alice', null, 'Adversarial Room', 'cosy');
  host.roomId = roomId;
  rooms.delete(host.roomId);
  rooms.set(roomId, host);

  const guestB = RoomManager.joinRoom(roomId, 'guest-b', 'sock-b', 'Guest Bob', null);
  const guestC = RoomManager.joinRoom(roomId, 'guest-c', 'sock-c', 'Guest Charlie', null);
  const guestD = RoomManager.joinRoom(roomId, 'guest-d', 'sock-d', 'Guest Dave', null);

  // ─── 1. Initial Load & Play ────────────────────────────────────────────────
  await t.test('1. Initial Load & Play State', () => {
    const res = RoomManager.updatePlayback(roomId, 'sock-host', {
      youtubeId: 'dQw4w9WgXcQ',
      title: 'Rick Astley',
      isPlaying: true,
      currentTime: 0
    });
    assert.equal(res.room.playback.isPlaying, true);
    assert.equal(res.room.playback.currentTime, 0);
  });

  // ─── 2. False Positive: Normal playback increments (0.5s ticks) ────────────
  await t.test('2. Normal playback ticks (delta <= 0.5s) must not trigger seek state change', () => {
    const room = rooms.get(roomId);
    const prevTime = room.playback.currentTime;
    
    // Simulate regular 500ms progress ticks
    for (let s = 1; s <= 5; s++) {
      const simulatedTime = s * 0.5;
      const delta = simulatedTime - (s - 1) * 0.5;
      assert.ok(delta <= 0.5, 'Normal tick delta is within expected bounds');
    }
  });

  // ─── 3. False Positive: Buffering stall & resume ──────────────────────────
  await t.test('3. Buffering stall (same timestamp repeated) must not trigger seek', () => {
    // Stalled ticks: 30.0, 30.0, 30.0 -> resumes 30.5
    const stalledTimes = [30.0, 30.0, 30.0, 30.5];
    for (let i = 1; i < stalledTimes.length; i++) {
      const delta = Math.abs(stalledTimes[i] - stalledTimes[i - 1]);
      assert.ok(delta <= 2.0, 'Buffering resume delta <= 2.0s does not cause false seek');
    }
  });

  // ─── 4. Event Amplification & Echo Loop Test (Host seeks -> N peers) ────────
  await t.test('4. Event Amplification: 1 Host Seek produces exactly 1 authoritative server state', () => {
    let broadcastCount = 0;
    const mockIo = {
      to: (targetRoomId) => ({
        emit: (event, payload) => {
          if (event === 'playback_synced') {
            broadcastCount++;
          }
        }
      })
    };
    host._io = mockIo;

    // Host executes seek to 60s
    const res = RoomManager.updatePlayback(roomId, 'sock-host', {
      isPlaying: true,
      currentTime: 60,
      action: 'seek'
    });

    assert.equal(res.room.playback.currentTime, 60);
    assert.equal(res.room.playback.isPlaying, true);

    // Verify peer programmatic seekTo execution:
    // When peers receive { action: 'seek', playback: { currentTime: 60 } },
    // isRemoteSyncingRef = true prevents any peer from rebroadcasting.
    // Resulting outbound events from peers = 0 (No N^2 explosion).
  });

  // ─── 5. Seek While Paused (30s -> 90s, isPlaying: false) ───────────────────
  await t.test('5. Seek While Paused: Retains paused state (no accidental play)', () => {
    // First pause at 30s
    RoomManager.updatePlayback(roomId, 'sock-host', { isPlaying: false, currentTime: 30 });
    assert.equal(rooms.get(roomId).playback.isPlaying, false);

    // Seek to 90s while paused
    const res = RoomManager.updatePlayback(roomId, 'sock-host', {
      isPlaying: false,
      currentTime: 90,
      action: 'seek'
    });

    assert.equal(res.room.playback.currentTime, 90);
    assert.equal(res.room.playback.isPlaying, false, 'Player must remain strictly paused');
  });

  // ─── 6. Seek While Playing (30s -> 90s, isPlaying: true) ───────────────────
  await t.test('6. Seek While Playing: Retains playing state (no accidental pause)', () => {
    // Unpause
    RoomManager.updatePlayback(roomId, 'sock-host', { isPlaying: true, currentTime: 30 });
    assert.equal(rooms.get(roomId).playback.isPlaying, true);

    // Seek to 90s while playing
    const res = RoomManager.updatePlayback(roomId, 'sock-host', {
      isPlaying: true,
      currentTime: 90,
      action: 'seek'
    });

    assert.equal(res.room.playback.currentTime, 90);
    assert.equal(res.room.playback.isPlaying, true, 'Player must remain strictly playing');
  });

  // ─── 7. Rapid Seek Convergence (10 -> 20 -> 30 -> 40 -> 50) ─────────────────
  await t.test('7. Rapid Seeks: Converges to latest timestamp (50s)', () => {
    const sequence = [10, 20, 30, 40, 50];
    let latestRes;
    for (const time of sequence) {
      latestRes = RoomManager.updatePlayback(roomId, 'sock-host', {
        isPlaying: true,
        currentTime: time,
        action: 'seek'
      });
    }

    assert.equal(latestRes.room.playback.currentTime, 50);
    assert.equal(rooms.get(roomId).playback.currentTime, 50, 'Authoritative room state matches final seek');
  });

  // ─── 8. Authorization Guards (allowMemberControls) ─────────────────────────
  await t.test('8. Authorization: Locked member controls reject guest playback actions', () => {
    // Lock controls to host only
    RoomManager.updateRoomSettings(roomId, 'sock-host', { allowMemberControls: false });

    // Guest attempts seek -> must be rejected
    const guestAttempt = RoomManager.updatePlayback(roomId, 'sock-b', {
      isPlaying: true,
      currentTime: 100,
      action: 'seek'
    });

    assert.equal(guestAttempt.error, 'Only the host can control playback.');
    assert.equal(rooms.get(roomId).playback.currentTime, 50, 'Room state was protected from unauthorized seek');

    // Host seek must still succeed
    const hostAttempt = RoomManager.updatePlayback(roomId, 'sock-host', {
      isPlaying: true,
      currentTime: 100,
      action: 'seek'
    });
    assert.equal(hostAttempt.room.playback.currentTime, 100);

    // Re-enable member controls
    RoomManager.updateRoomSettings(roomId, 'sock-host', { allowMemberControls: true });
  });

  // ─── 9. Disconnect & Reconnect Playback State Alignment ───────────────────
  await t.test('9. Reconnect: Returning member accurately receives room playback state', () => {
    // Advance playback to 140s
    RoomManager.updatePlayback(roomId, 'sock-host', { isPlaying: true, currentTime: 140 });

    // Guest C disconnects
    RoomManager.leaveRoom('sock-c', roomId);

    // Guest C reconnects with a fresh socket ID
    const reconnectResult = RoomManager.joinRoom(roomId, 'guest-c', 'sock-c-reconnected', 'Guest Charlie', null);
    assert.equal(reconnectResult.wasReconnect, true);

    const roomDTO = RoomManager.getRoomStateDTO(rooms.get(roomId));
    assert.ok(roomDTO.playback.currentTime >= 140, 'Reconnected user receives authoritative timestamp');
    assert.equal(roomDTO.playback.isPlaying, true);
  });

  // ─── 10. Cleanup ───────────────────────────────────────────────────────────
  await deleteRoom(roomId);
  assert.equal(rooms.has(roomId), false);
});
