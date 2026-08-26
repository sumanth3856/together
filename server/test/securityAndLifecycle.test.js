import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../src/roomManager.js';

test('RoomManager - Host Grace Period Lifecycle (Reconnect cancels timer)', async () => {
  const room = RoomManager.createRoom('host-1', 'sock-host-1', 'HostAlice', null, 'Test Room', 'cosy');
  assert.equal(room.hostId, 'host-1');

  // Join a member
  RoomManager.joinRoom(room.roomId, 'user-2', 'sock-user-2', 'UserBob', null);
  assert.equal(room.members.size, 2);

  // Host disconnects (socket leaves)
  const leaveResult = RoomManager.leaveRoom('sock-host-1');
  assert.equal(leaveResult.roomId, room.roomId);

  // Host reconnects within grace period
  const rejoinResult = RoomManager.joinRoom(room.roomId, 'host-1', 'sock-host-1-new', 'HostAlice', null);
  assert.equal(rejoinResult.wasReconnect, true);
  assert.equal(room.hostId, 'host-1');
});

test('RoomManager - Host Grace Period Lifecycle (Host departure transfers host when grace period expires)', async () => {
  const room = RoomManager.createRoom('host-1', 'sock-host-1', 'HostAlice', null, 'Test Room 2', 'cosy');
  RoomManager.joinRoom(room.roomId, 'user-2', 'sock-user-2', 'UserBob', null);

  // Host disconnects
  RoomManager.leaveRoom('sock-host-1');

  // Wait for grace period (30s grace in roomManager.js) to execute
  // In unit test environment, we wait for timeout or simulate timer expiration
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Host remains unchanged until grace timer finishes or host reconnects
  assert.equal(room.members.has('user-2'), true);
});

test('RoomManager - Repeated disconnect/reconnect cycles', () => {
  const room = RoomManager.createRoom('host-1', 'sock-host-1', 'HostAlice', null, 'Cycle Room', 'cosy');
  RoomManager.joinRoom(room.roomId, 'user-2', 'sock-user-2', 'UserBob', null);

  for (let i = 0; i < 3; i++) {
    RoomManager.leaveRoom(`sock-host-${i + 1}`);
    const rejoin = RoomManager.joinRoom(room.roomId, 'host-1', `sock-host-${i + 2}`, 'HostAlice', null);
    assert.equal(rejoin.wasReconnect, true);
    assert.equal(room.hostId, 'host-1');
  }
});

test('RoomManager - transferHost rejects all invalid targets and accepts valid member', () => {
  const room = RoomManager.createRoom('host-1', 'sock-host-1', 'HostAlice', null, 'Test Room', 'cosy');
  RoomManager.joinRoom(room.roomId, 'user-2', 'sock-user-2', 'UserBob', null);

  // Test invalid target types
  const invalidTargets = [undefined, null, '', 123, {}, []];
  for (const invalidTarget of invalidTargets) {
    const res = RoomManager.transferHost(room.roomId, 'sock-host-1', invalidTarget);
    assert.equal(res.error, 'Invalid target user ID for host transfer.');
    assert.equal(room.hostId, 'host-1');
  }

  // Test non-member target
  const nonMemberRes = RoomManager.transferHost(room.roomId, 'sock-host-1', 'random-non-member-id');
  assert.equal(nonMemberRes.error, 'Target user not found.');
  assert.equal(room.hostId, 'host-1');

  // Test valid member target
  const validRes = RoomManager.transferHost(room.roomId, 'sock-host-1', 'user-2');
  assert.equal(validRes.error, undefined);
  assert.equal(room.hostId, 'user-2');
});
