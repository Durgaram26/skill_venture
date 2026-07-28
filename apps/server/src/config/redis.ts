import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;
// Set to true only after a successful ping — so failed connections fall back gracefully
let redisAvailable = false;

export function hasRedis(): boolean {
  return redisAvailable;
}

export function getRedis(): Redis {
  if (!redisClient || !redisAvailable) {
    throw new Error('Redis is not available');
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) {
    console.log('[redis] REDIS_URL not set — using in-memory fallback');
    return;
  }
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await redisClient.ping();
    redisAvailable = true;
    console.log('[redis] ✅ connected');
  } catch (err) {
    console.warn('[redis] ⚠️ connection failed — using in-memory fallback:', (err as Error).message);
    redisClient?.disconnect();
    redisClient = null;
    redisAvailable = false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisAvailable = false;
  }
}
