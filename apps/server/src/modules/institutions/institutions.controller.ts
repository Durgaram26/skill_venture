import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as institutionsService from './institutions.service.js';
import type { UpdatePayoutDetailsInput } from './institutions.validation.js';

export async function getMyPayout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await institutionsService.getMyPayoutDetails(authReq.user.id);
    res.status(200).json({ success: true, data: { payout: data } });
  } catch (error) {
    next(error);
  }
}

export async function updateMyPayout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await institutionsService.updateMyPayoutDetails(
      authReq.user.id,
      req.body as UpdatePayoutDetailsInput,
    );
    res.status(200).json({ success: true, data: { payout: data } });
  } catch (error) {
    next(error);
  }
}
