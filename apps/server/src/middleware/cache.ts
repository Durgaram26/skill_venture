import type { Request, Response, NextFunction } from 'express';
import { getRedis, hasRedis } from '../config/redis.js';
import { env } from '../config/env.js';

const memory = new Map<string, { expires: number; value: string }>();

async function cacheGet(key: string): Promise<string | null> {
  if (env.NODE_ENV === 'test' || !hasRedis()) {
    const hit = memory.get(key);
    if (!hit || hit.expires < Date.now()) {
      memory.delete(key);
      return null;
    }
    return hit.value;
  }
  try {
    return await getRedis().get(key);
  } catch {
    return null;
  }
}

async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (env.NODE_ENV === 'test' || !hasRedis()) {
    memory.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
    return;
  }
  try {
    await getRedis().set(key, value, 'EX', ttlSeconds);
  } catch {
    // cache miss is fine
  }
}

export async function invalidateListingCaches(): Promise<void> {
  if (env.NODE_ENV === 'test' || !hasRedis()) {
    for (const key of memory.keys()) {
      if (key.startsWith('listings:') || key.startsWith('listing:')) memory.delete(key);
    }
    return;
  }
  try {
    const redis = getRedis();
    const keys = await redis.keys('listings:*');
    const slugKeys = await redis.keys('listing:*');
    const all = [...keys, ...slugKeys];
    if (all.length) await redis.del(...all);
  } catch {
    // ignore
  }
}

/** Cache successful JSON GET responses for public listing feeds. */
export function cachePublicListings(ttlSeconds = 45) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      next();
      return;
    }
    const key = `listings:${req.originalUrl}`;
    try {
      const cached = await cacheGet(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.type('json').send(cached);
        return;
      }
    } catch {
      // continue
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        void cacheSet(key, JSON.stringify(body), ttlSeconds);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    }) as Response['json'];

    next();
  };
}
