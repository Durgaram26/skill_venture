import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as notificationsService from './notifications.service.js';

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = (
      req as Request & {
        validatedQuery: { page?: number; limit?: number; unreadOnly?: boolean };
      }
    ).validatedQuery;
    const data = await notificationsService.listNotifications(authReq.user.id, query ?? {});
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await notificationsService.markNotificationRead(
      authReq.user.id,
      req.params.id as string,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function registerPush(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as { token: string; platform?: 'web' | 'android' | 'ios' };
    const data = await notificationsService.registerDeviceToken(
      authReq.user.id,
      body.token,
      body.platform ?? 'web',
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
