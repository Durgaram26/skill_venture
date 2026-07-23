import type { Request, Response, NextFunction } from 'express';
import * as uploadsService from './uploads.service.js';
import type { ListingImageUploadInput } from './uploads.validation.js';

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
