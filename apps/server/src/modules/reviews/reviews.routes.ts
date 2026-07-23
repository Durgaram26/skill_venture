import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import * as controller from './reviews.controller.js';
import {
  createReviewSchema,
  listingIdParamsSchema,
  replyReviewSchema,
  reviewIdParamsSchema,
} from './reviews.validation.js';

export const reviewsRouter = Router();

reviewsRouter.post(
  '/',
  authenticate,
  authorize('student'),
  validateBody(createReviewSchema),
  controller.create,
);

reviewsRouter.post(
  '/:id/reply',
  authenticate,
  authorize('institution'),
  validateParams(reviewIdParamsSchema),
  validateBody(replyReviewSchema),
  controller.reply,
);

/** Mounted under /api/v1/listings/:id/reviews */
export const listingReviewsRouter = Router({ mergeParams: true });

listingReviewsRouter.get('/', validateParams(listingIdParamsSchema), controller.listForListing);
