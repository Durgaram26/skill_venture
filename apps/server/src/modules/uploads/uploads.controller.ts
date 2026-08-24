import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { User } from '../../models/User.js';
import * as uploadsService from './uploads.service.js';
import type { ListingImageUploadInput, ProfileImageUploadInput } from './uploads.validation.js';

export async function uploadListingImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = await uploadsService.saveListingImage(req.body as ListingImageUploadInput);
    res.status(201).json({ success: true, data: { file } });
  } catch (error) {
    next(error);
  }
}

export async function uploadProfileImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = await uploadsService.saveProfileImage(req.body as ProfileImageUploadInput);
    const authReq = req as AuthenticatedRequest;
    await User.findByIdAndUpdate(authReq.user.id, { $set: { 'profile.avatar': file.url } });
    res.status(201).json({ success: true, data: { file } });
  } catch (error) {
    next(error);
  }
}
