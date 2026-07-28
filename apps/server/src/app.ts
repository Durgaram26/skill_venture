import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import listingsRouter, {
  institutionListingsRouter,
  institutionsPublicRouter,
} from './modules/listings/listings.routes.js';
import {
  enquiriesRouter,
  institutionEnquiriesRouter,
  studentEnquiriesRouter,
} from './modules/enquiries/enquiries.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import platformRoutes from './modules/platform/platform.routes.js';
import { bookmarksRouter, studentBookmarksRouter } from './modules/bookmarks/bookmarks.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import seoRoutes from './modules/seo/seo.routes.js';
import { reviewsRouter, listingReviewsRouter } from './modules/reviews/reviews.routes.js';
import paymentsRouter, {
  institutionAnalyticsRouter,
  institutionEarningsRouter,
  institutionSubscriptionRouter,
  studentPaymentsRouter,
} from './modules/payments/payments.routes.js';
import institutionUploadsRouter from './modules/uploads/uploads.routes.js';
import { institutionPayoutRouter } from './modules/institutions/institutions.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  // Image uploads need a larger JSON body — register before the global parser.
  app.use('/api/v1/institutions/me/uploads', institutionUploadsRouter);

  app.use(
    express.json({
      limit: '100kb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        service: 'skillventures-api',
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use(seoRoutes);

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/listings', listingsRouter);
  app.use('/api/v1/listings/:id/reviews', listingReviewsRouter);
  app.use('/api/v1/reviews', reviewsRouter);
  app.use('/api/v1/institutions/me/listings', institutionListingsRouter);
  app.use('/api/v1/institutions/me/enquiries', institutionEnquiriesRouter);
  app.use('/api/v1/institutions/me/subscription', institutionSubscriptionRouter);
  app.use('/api/v1/institutions/me/analytics', institutionAnalyticsRouter);
  app.use('/api/v1/institutions/me/earnings', institutionEarningsRouter);
  app.use('/api/v1/institutions/me/payout', institutionPayoutRouter);
  app.use('/api/v1/institutions', institutionsPublicRouter);
  app.use('/api/v1/enquiries', enquiriesRouter);
  app.use('/api/v1/students/me/enquiries', studentEnquiriesRouter);
  app.use('/api/v1/bookmarks', bookmarksRouter);
  app.use('/api/v1/students/me/bookmarks', studentBookmarksRouter);
  app.use('/api/v1/students/me/payments', studentPaymentsRouter);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/subscriptions', paymentsRouter);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/platform', platformRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
