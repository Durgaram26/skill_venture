import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@skillventures/shared-types';
import { env } from '../../config/env.js';
import type { AccessTokenPayload } from '../../middleware/auth.js';
import { getTokenStore } from './token.store.js';

const REFRESH_PREFIX = 'refresh:';
const USER_REFRESH_SET_PREFIX = 'user_refresh:';

export interface RefreshTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
  jti: string;
  type: 'refresh';
}

function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return value * (multipliers[unit] ?? 1);
}

export function signAccessToken(params: { userId: string; role: UserRole; email: string }): {
  accessToken: string;
  expiresIn: number;
} {
  const expiresIn = parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN);
  const payload: AccessTokenPayload = {
    sub: params.userId,
    role: params.role,
    email: params.email,
    type: 'access',
  };
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn,
  } satisfies jwt.SignOptions);
  return { accessToken, expiresIn };
}

export async function issueRefreshToken(params: {
  userId: string;
  role: UserRole;
  email: string;
}): Promise<string> {
  const jti = crypto.randomUUID();
  const expiresIn = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN);
  const payload: RefreshTokenPayload = {
    sub: params.userId,
    role: params.role,
    email: params.email,
    jti,
    type: 'refresh',
  };

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn,
  } satisfies jwt.SignOptions);

  const store = getTokenStore();
  const key = `${REFRESH_PREFIX}${jti}`;
  await store.set(key, params.userId, expiresIn);
  await store.sadd(`${USER_REFRESH_SET_PREFIX}${params.userId}`, jti);
  await store.expire(`${USER_REFRESH_SET_PREFIX}${params.userId}`, expiresIn);

  return refreshToken;
}

export async function rotateRefreshToken(rawToken: string): Promise<{
  userId: string;
  role: UserRole;
  email: string;
  refreshToken: string;
}> {
  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { code: 'INVALID_REFRESH' });
  }

  if (payload.type !== 'refresh') {
    throw Object.assign(new Error('Invalid refresh token type'), { code: 'INVALID_REFRESH' });
  }

  const store = getTokenStore();
  const key = `${REFRESH_PREFIX}${payload.jti}`;
  const storedUserId = await store.get(key);

  if (!storedUserId || storedUserId !== payload.sub) {
    await revokeAllRefreshTokens(payload.sub);
    throw Object.assign(new Error('Refresh token reuse detected'), {
      code: 'REFRESH_REUSE',
    });
  }

  await store.del(key);
  await store.srem(`${USER_REFRESH_SET_PREFIX}${payload.sub}`, payload.jti);

  const refreshToken = await issueRefreshToken({
    userId: payload.sub,
    role: payload.role,
    email: payload.email,
  });

  return {
    userId: payload.sub,
    role: payload.role,
    email: payload.email,
    refreshToken,
  };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  try {
    const payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (payload.type !== 'refresh') return;
    const store = getTokenStore();
    await store.del(`${REFRESH_PREFIX}${payload.jti}`);
    await store.srem(`${USER_REFRESH_SET_PREFIX}${payload.sub}`, payload.jti);
  } catch {
    // Token already invalid — treat logout as success
  }
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  const store = getTokenStore();
  const setKey = `${USER_REFRESH_SET_PREFIX}${userId}`;
  const jtis = await store.smembers(setKey);
  for (const jti of jtis) {
    await store.del(`${REFRESH_PREFIX}${jti}`);
  }
  await store.del(setKey);
}

export const REFRESH_COOKIE_NAME = 'sv_refresh';

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE ?? env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/v1/auth',
    maxAge: parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000,
  };
}
