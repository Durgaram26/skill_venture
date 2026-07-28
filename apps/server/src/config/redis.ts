import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;

export function hasRedis(): boolean {
  return Boolean(env.REDIS_URL);
}

export function getRedis(): Redis {
  if (!env.REDIS_URL) {
    throw new Error('Redis is not configured (REDIS_URL not set)');
  }
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) {
    console.log('[redis] REDIS_URL not set — running without Redis (in-memory fallback)');
    return;
  }
  const client = getRedis();
  await client.ping();
  console.log('[redis] connected');
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
