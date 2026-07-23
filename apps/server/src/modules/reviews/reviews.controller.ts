import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as reviewsService from './reviews.service.js';
import type { CreateReviewInput } from './reviews.validation.js';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const review = await reviewsService.createReview(
      authReq.user.id,
      req.body as CreateReviewInput,
    );
    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
}

export async function listForListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const items = await reviewsService.listListingReviews(req.params.id as string);
    res.status(200).json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}

export async function reply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const review = await reviewsService.replyToReview(
      authReq.user.id,
      req.params.id as string,
      (req.body as { text: string }).text,
    );
    res.status(200).json({ success: true, data: { review } });
  } catch (error) {
    next(error);
  }
}
