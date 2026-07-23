import { Router } from 'express';
import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './uploads.controller.js';
import { listingImageUploadSchema } from './uploads.validation.js';

const router = Router();

router.use(authenticate, authorize('institution'));
router.post(
  '/listing-image',
  express.json({ limit: '6mb' }),
  validateBody(listingImageUploadSchema),
  controller.uploadListingImage,
);

export default router;
