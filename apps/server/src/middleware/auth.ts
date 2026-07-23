import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@skillventures/shared-types';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
  type: 'access';
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: UserRole;
    email: string;
  };
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = header.slice('Bearer '.length);
    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    } catch {
      throw new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN');
    }

    if (payload.type !== 'access') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN');
    }

    const user = await User.findById(payload.sub).select('role email isBanned').lean();
    if (!user) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED');
    }
    if (user.isBanned) {
      throw new AppError('Account is banned', 403, 'ACCOUNT_BANNED');
    }

    (req as AuthenticatedRequest).user = {
      id: String(user._id),
      role: user.role,
      email: user.email,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      return;
    }
    if (!roles.includes(authReq.user.role)) {
      next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
      return;
    }
    next();
  };
}
