/**
 * Refresh-token persistence.
 * Uses Redis in non-test environments; in-memory Map for Jest (no Docker required).
 */
import { env } from '../../config/env.js';
import { getRedis, hasRedis } from '../../config/redis.js';

interface TokenStore {
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  expire(key: string, ttlSeconds: number): Promise<void>;
}

class MemoryTokenStore implements TokenStore {
  private strings = new Map<string, { value: string; expiresAt: number }>();
  private sets = new Map<string, { members: Set<string>; expiresAt: number }>();

  private alive(expiresAt: number): boolean {
    return expiresAt > Date.now();
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.strings.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.strings.get(key);
    if (!entry || !this.alive(entry.expiresAt)) {
      this.strings.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    this.strings.delete(key);
    this.sets.delete(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    const existing = this.sets.get(key);
    if (existing && this.alive(existing.expiresAt)) {
      existing.members.add(member);
      return;
    }
    this.sets.set(key, { members: new Set([member]), expiresAt: Date.now() + 7 * 86400 * 1000 });
  }

  async srem(key: string, member: string): Promise<void> {
    const existing = this.sets.get(key);
    existing?.members.delete(member);
  }

  async smembers(key: string): Promise<string[]> {
    const existing = this.sets.get(key);
    if (!existing || !this.alive(existing.expiresAt)) {
      this.sets.delete(key);
      return [];
    }
    return [...existing.members];
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const set = this.sets.get(key);
    if (set) {
      set.expiresAt = Date.now() + ttlSeconds * 1000;
    }
    const str = this.strings.get(key);
    if (str) {
      str.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }

  flush(): void {
    this.strings.clear();
    this.sets.clear();
  }
}

class RedisTokenStore implements TokenStore {
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await getRedis().set(key, value, 'EX', ttlSeconds);
  }
  async get(key: string): Promise<string | null> {
    return getRedis().get(key);
  }
  async del(key: string): Promise<void> {
    await getRedis().del(key);
  }
  async sadd(key: string, member: string): Promise<void> {
    await getRedis().sadd(key, member);
  }
  async srem(key: string, member: string): Promise<void> {
    await getRedis().srem(key, member);
  }
  async smembers(key: string): Promise<string[]> {
    return getRedis().smembers(key);
  }
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await getRedis().expire(key, ttlSeconds);
  }
}

const memoryStore = new MemoryTokenStore();

export function getTokenStore(): TokenStore {
  return env.NODE_ENV === 'test' || !hasRedis() ? memoryStore : new RedisTokenStore();
}

export function flushMemoryTokenStore(): void {
  memoryStore.flush();
}
