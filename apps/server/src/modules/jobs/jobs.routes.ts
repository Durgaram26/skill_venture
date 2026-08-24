import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as controller from './jobs.controller.js';

/* ── Institution routes: /api/v1/institutions/me/jobs ── */
export const institutionJobsRouter = Router();
institutionJobsRouter.use(authenticate, authorize('institution'));
institutionJobsRouter.get('/', controller.listMyJobs);
institutionJobsRouter.post('/', controller.createJob);
institutionJobsRouter.patch('/:id', controller.updateJob);
institutionJobsRouter.delete('/:id', controller.deleteJob);

/* ── Student routes: /api/v1/students/me/jobs ── */
export const studentJobFeedRouter = Router();
studentJobFeedRouter.use(authenticate, authorize('student'));
studentJobFeedRouter.get('/', controller.studentFeed);

/* ── Public routes: /api/v1/institutions/:id/jobs ── */
export const institutionPublicJobsRouter = Router({ mergeParams: true });
institutionPublicJobsRouter.get('/', controller.institutionPublicJobs);
