import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager, rooms, persistenceState } from '../src/roomManager.js';

test('Memory Stability & Room Lifecycle Stress Test (100 Iterations)', async () => {
  // Force garbage collection if available or take initial snapshot
  if (global.gc) global.gc();
  const initialMemory = process.memoryUsage().heapUsed;

  const ITERATIONS = 100;
  for (let i = 0; i < ITERATIONS; i++) {
    // 1. Create Room
    const room = RoomManager.createRoom(`host-stress-${i}`, `sock-h-${i}`, `Host_${i}`, null, `Stress Room ${i}`, 'cosy');
    const roomId = room.roomId;

    // 2. Join 5 members
    for (let m = 1; m <= 5; m++) {
      RoomManager.joinRoom(roomId, `user-${i}-${m}`, `sock-${i}-${m}`, `Member_${m}`, null);
    }

    // 3. Add to queue & update playback
    RoomManager.addToQueue(roomId, `sock-h-${i}`, { youtubeId: `vid-${i}`, title: `Title ${i}` });
    RoomManager.updatePlayback(roomId, `sock-h-${i}`, { isPlaying: true, currentTime: 10 + i });

    // 4. Send chat messages
    for (let c = 0; c < 5; c++) {
      RoomManager.addChatMessage(roomId, `sock-${i}-1`, `Chat message ${c} in iteration ${i}`);
    }

    // 5. Members leave
    for (let m = 1; m <= 5; m++) {
      RoomManager.leaveRoom(`sock-${i}-${m}`, roomId);
    }

    // 6. Host intentionally leaves (disbands room)
    RoomManager.intentionalLeave(`sock-h-${i}`, roomId);

    // Verify room was removed from active memory
    assert.equal(rooms.has(roomId), false);
  }

  if (global.gc) global.gc();
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryDeltaMB = ((finalMemory - initialMemory) / (1024 * 1024)).toFixed(2);

  // Active rooms in memory should be 0
  assert.equal(rooms.size, 0);

  console.log(`[Memory Stability Benchmark] 100 Room Lifecycles:
    Initial Heap: ${(initialMemory / (1024 * 1024)).toFixed(2)} MB
    Final Heap:   ${(finalMemory / (1024 * 1024)).toFixed(2)} MB
    Delta:        ${memoryDeltaMB} MB
    Active Rooms: ${rooms.size}`);
});
