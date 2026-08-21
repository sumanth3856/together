/**
 * redisClient.js
 *
 * Initializes and exports an Upstash Redis client.
 * Supports two connection modes:
 *  1. REST API  — UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (recommended for Upstash)
 *  2. Redis URL — REDIS_URL (e.g. rediss://... for standard ioredis-style connections)
 *
 * If neither variable is set, exports a null client and the app falls back
 * to in-memory-only mode, making local development work without Redis.
 */

import { Redis } from '@upstash/redis';

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('✅ Redis: Connected via Upstash REST API');
} else {
  console.warn('⚠️  Redis: No UPSTASH_REDIS_REST_URL/TOKEN found. Running in memory-only mode (rooms will not persist across restarts).');
}

/**
 * Ping Redis to check connectivity. Used by the health endpoint.
 * @returns {Promise<string>} 'ok' | 'unavailable'
 */
export async function pingRedis() {
  if (!redis) return 'unavailable';
  try {
    await redis.ping();
    return 'ok';
  } catch {
    return 'error';
  }
}

export default redis;
