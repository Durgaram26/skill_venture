import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import * as controller from './enquiries.controller.js';
import {
  createEnquirySchema,
  enquiryIdParamsSchema,
  enquiryListQuerySchema,
  enquiryStatusSchema,
} from './enquiries.validation.js';

export const enquiriesRouter = Router();

enquiriesRouter.post(
  '/',
  authenticate,
  authorize('student'),
  authRateLimiter,
  validateBody(createEnquirySchema),
  controller.create,
);

export const studentEnquiriesRouter = Router();

studentEnquiriesRouter.get(
  '/',
  authenticate,
  authorize('student'),
  validateQuery(enquiryListQuerySchema),
  controller.listMineStudent,
);

export const institutionEnquiriesRouter = Router();

institutionEnquiriesRouter.get(
  '/',
  authenticate,
  authorize('institution'),
  validateQuery(enquiryListQuerySchema),
  controller.listMineInstitution,
);

institutionEnquiriesRouter.patch(
  '/:id',
  authenticate,
  authorize('institution'),
  validateParams(enquiryIdParamsSchema),
  validateBody(enquiryStatusSchema),
  controller.updateStatus,
);
