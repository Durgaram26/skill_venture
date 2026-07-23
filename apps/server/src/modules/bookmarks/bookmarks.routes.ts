import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateParams } from '../../middleware/validate.js';
import * as controller from './bookmarks.controller.js';

const listingIdParams = z.object({ listingId: z.string().min(1) }).strict();

export const bookmarksRouter = Router();

bookmarksRouter.post(
  '/:listingId',
  authenticate,
  authorize('student'),
  validateParams(listingIdParams),
  controller.add,
);

bookmarksRouter.delete(
  '/:listingId',
  authenticate,
  authorize('student'),
  validateParams(listingIdParams),
  controller.remove,
);

export const studentBookmarksRouter = Router();

studentBookmarksRouter.get('/', authenticate, authorize('student'), controller.listMine);
