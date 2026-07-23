import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './institutions.controller.js';
import { updatePayoutDetailsSchema } from './institutions.validation.js';

export const institutionPayoutRouter = Router();

institutionPayoutRouter.use(authenticate, authorize('institution'));

institutionPayoutRouter.get('/', controller.getMyPayout);
institutionPayoutRouter.put(
  '/',
  validateBody(updatePayoutDetailsSchema),
  controller.updateMyPayout,
);
