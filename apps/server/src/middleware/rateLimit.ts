import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RedisReply } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';

function createRedisStore(prefix: string): RedisStore | undefined {
  if (env.NODE_ENV === 'test') {
    return undefined;
  }

  const client = getRedis();
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]): Promise<RedisReply> => {
      const [command, ...commandArgs] = args;
      if (!command) {
        return Promise.reject(new Error('Redis command required'));
      }
      return client.call(command, ...commandArgs) as Promise<RedisReply>;
    },
  });
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  // Successful refreshes/logins should not consume the failed-attempt budget.
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      message: 'Too many auth attempts. Try again later.',
      code: 'RATE_LIMITED',
    },
  },
  store: createRedisStore('rl:auth:'),
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Try again later.',
      code: 'RATE_LIMITED',
    },
  },
  store: createRedisStore('rl:api:'),
});
