import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms } from '../src/roomManager.js';

test('RoomManager - Core Logic', async (t) => {
  await t.test('createRoom should initialize a room correctly', () => {
    const room = RoomManager.createRoom('socket-1', 'HostAlice');
    assert.ok(room.roomId.startsWith('TOG-'));
    assert.equal(room.hostId, 'socket-1');
    assert.equal(room.members.size, 1);
    
    const host = room.members.get('socket-1');
    assert.equal(host.nickname, 'HostAlice');
    assert.equal(host.isHost, true);
    assert.equal(host.hasControl, true);
  });

  await t.test('joinRoom should add a member correctly', () => {
    const room = RoomManager.createRoom('socket-2', 'HostBob');
    const result = RoomManager.joinRoom(room.roomId, 'socket-3', 'GuestCharlie');
    
    assert.ok(!result.error);
    assert.equal(result.room.members.size, 2);
    
    const guest = result.member;
    assert.equal(guest.nickname, 'GuestCharlie');
    assert.equal(guest.isHost, false);
    assert.equal(guest.hasControl, false);
  });

  await t.test('leaveRoom should reassign host if host leaves', () => {
    const room = RoomManager.createRoom('socket-4', 'HostDave');
    RoomManager.joinRoom(room.roomId, 'socket-5', 'GuestEve');
    
    const result = RoomManager.leaveRoom('socket-4');
    assert.equal(result.roomId, room.roomId);
    
    const remainingRoom = RoomManager.getRoom(room.roomId);
    assert.equal(remainingRoom.members.size, 1);
    assert.equal(remainingRoom.hostId, 'socket-5');
    
    const newHost = remainingRoom.members.get('socket-5');
    assert.equal(newHost.isHost, true);
    assert.equal(newHost.hasControl, true);
  });

  await t.test('updatePlayback should reject non-controllers', () => {
    const room = RoomManager.createRoom('socket-6', 'Host');
    RoomManager.joinRoom(room.roomId, 'socket-7', 'Guest');
    
    const result = RoomManager.updatePlayback(room.roomId, 'socket-7', { isPlaying: true });
    assert.ok(result.error);
    assert.equal(result.error, 'Permission denied. Only host or users with control can manage playback.');
  });
});
