import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as controller from './admin.controller.js';
import {
  adminListQuerySchema,
  adminUsersQuerySchema,
  banUserSchema,
  idParamsSchema,
  moderateListingSchema,
  moderateReviewSchema,
  setUserRoleSchema,
  updateSettingsSchema,
  updateSupportTicketSchema,
  verifyInstitutionSchema,
} from './admin.validation.js';

const router = Router();

router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/institutions', validateQuery(adminListQuerySchema), controller.listInstitutions);
router.patch(
  '/institutions/:id/verify',
  validateParams(idParamsSchema),
  validateBody(verifyInstitutionSchema),
  controller.verifyInstitution,
);

router.get('/listings', validateQuery(adminListQuerySchema), controller.listListings);
router.patch(
  '/listings/:id/moderate',
  validateParams(idParamsSchema),
  validateBody(moderateListingSchema),
  controller.moderateListing,
);

router.get('/reviews', validateQuery(adminListQuerySchema), controller.listReviews);
router.patch(
  '/reviews/:id/moderate',
  validateParams(idParamsSchema),
  validateBody(moderateReviewSchema),
  controller.moderateReview,
);

router.get('/users', validateQuery(adminUsersQuerySchema), controller.listUsers);
router.patch(
  '/users/:id/ban',
  validateParams(idParamsSchema),
  validateBody(banUserSchema),
  controller.banUser,
);

router.get('/analytics', controller.analytics);

router.get('/support/tickets', validateQuery(adminListQuerySchema), controller.listSupportTickets);
router.patch(
  '/support/tickets/:id',
  validateParams(idParamsSchema),
  validateBody(updateSupportTicketSchema),
  controller.updateSupportTicket,
);

// Super admin only
router.get('/audit-logs', authorize('super_admin'), validateQuery(adminListQuerySchema), controller.listAuditLogs);
router.get('/admins', authorize('super_admin'), controller.listAdmins);
router.patch(
  '/users/:id/role',
  authorize('super_admin'),
  validateParams(idParamsSchema),
  validateBody(setUserRoleSchema),
  controller.setUserRole,
);
router.get('/settings', authorize('super_admin'), controller.getSettings);
router.patch(
  '/settings',
  authorize('super_admin'),
  validateBody(updateSettingsSchema),
  controller.updateSettings,
);
router.get('/analytics/financial', authorize('super_admin'), controller.financialReport);

export default router;
