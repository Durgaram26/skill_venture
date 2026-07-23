import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import * as controller from './payments.controller.js';
import { createEnrollmentOrderSchema, createOrderSchema } from './payments.validation.js';
import { z } from 'zod';

const router = Router();

router.post(
  '/create-order',
  authenticate,
  authorize('institution'),
  validateBody(createOrderSchema),
  controller.createOrder,
);

router.post(
  '/enroll',
  authenticate,
  authorize('student'),
  validateBody(createEnrollmentOrderSchema),
  controller.createEnrollmentOrder,
);

router.post('/webhook', controller.webhook);

router.get('/', authenticate, authorize('institution'), controller.getSubscription);

router.post(
  '/confirm-mock',
  authenticate,
  authorize('institution', 'student'),
  validateBody(z.object({ orderId: z.string().min(1) }).strict()),
  controller.confirmMockPayment,
);

export default router;

export const institutionSubscriptionRouter = Router();
institutionSubscriptionRouter.get(
  '/',
  authenticate,
  authorize('institution'),
  controller.getSubscription,
);

export const institutionAnalyticsRouter = Router();
institutionAnalyticsRouter.get(
  '/',
  authenticate,
  authorize('institution'),
  controller.getAnalytics,
);

export const institutionEarningsRouter = Router();
institutionEarningsRouter.get(
  '/',
  authenticate,
  authorize('institution'),
  controller.listInstitutionEarnings,
);

export const studentPaymentsRouter = Router();
studentPaymentsRouter.get(
  '/',
  authenticate,
  authorize('student'),
  controller.listStudentPayments,
);
