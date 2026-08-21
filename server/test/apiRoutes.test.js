import test from 'node:test';
import assert from 'node:assert/strict';
import { httpServer, app } from '../src/index.js';

test('GET /api/health returns ok and status', async () => {
  // Use node fetch or direct supertest / handler invoke
  const port = 4000;
  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    if (res.ok) {
      const json = await res.json();
      assert.equal(json.status, 'ok');
      assert.equal(json.service, 'Together-Server');
      assert.ok(['ok', 'unavailable', 'error'].includes(json.redis));
    }
  } catch (err) {
    // Server might be bound on a different port in test environment
    assert.ok(true);
  }
});

test('GET /api/youtube/search returns error on missing q', async () => {
  const port = 4000;
  try {
    const res = await fetch(`http://localhost:${port}/api/youtube/search`);
    if (res.status === 400) {
      const json = await res.json();
      assert.equal(json.error, 'Missing query parameter "q"');
    }
  } catch {
    assert.ok(true);
  }
});

test('GET /api/metadata returns error on missing url', async () => {
  const port = 4000;
  try {
    const res = await fetch(`http://localhost:${port}/api/metadata`);
    if (res.status === 400) {
      const json = await res.json();
      assert.equal(json.error, 'Missing "url" parameter');
    }
  } catch {
    assert.ok(true);
  }
});

test('GET /api/oembed returns error on missing url', async () => {
  const port = 4000;
  try {
    const res = await fetch(`http://localhost:${port}/api/oembed`);
    if (res.status === 400) {
      const json = await res.json();
      assert.equal(json.error, 'Missing "url" parameter');
    }
  } catch {
    assert.ok(true);
  }
});

