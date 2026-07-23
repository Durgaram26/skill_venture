import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<Redis> {
  const client = getRedis();
  await client.ping();
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
