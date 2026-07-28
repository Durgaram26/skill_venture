import { Router } from 'express';
import { authenticate, authenticateOptional, authorize } from '../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as controller from './enquiries.controller.js';
import {
  createEnquirySchema,
  enquiryIdParamsSchema,
  enquiryListQuerySchema,
  enquiryStatusSchema,
} from './enquiries.validation.js';

export const enquiriesRouter = Router();

// Open to guests — students are linked automatically when logged in.
enquiriesRouter.post(
  '/',
  authenticateOptional,
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
