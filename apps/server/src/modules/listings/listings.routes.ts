import { Router } from 'express';
import { authenticate, authenticateOptional, authorize } from '../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { cachePublicListings } from '../../middleware/cache.js';
import * as controller from './listings.controller.js';
import {
  createListingSchema,
  listingIdParamsSchema,
  listingListQuerySchema,
  listingSlugParamsSchema,
  suggestQuerySchema,
  searchQuerySchema,
  compareQuerySchema,
  updateListingSchema,
} from './listings.validation.js';
import { z } from 'zod';

const router = Router();

const idParams = z.object({ id: z.string().min(1) }).strict();

router.get('/', validateQuery(listingListQuerySchema), cachePublicListings(45), controller.listPublic);
router.get('/suggest', validateQuery(suggestQuerySchema), cachePublicListings(15), controller.suggest);
router.get('/search', validateQuery(searchQuerySchema), cachePublicListings(30), controller.search);
router.get('/compare', validateQuery(compareQuerySchema), controller.compare);
router.get('/:slug', authenticateOptional, validateParams(listingSlugParamsSchema), controller.getBySlug);

export const institutionListingsRouter = Router();

institutionListingsRouter.use(authenticate, authorize('institution'));

institutionListingsRouter.get('/', validateQuery(listingListQuerySchema), controller.listMine);
institutionListingsRouter.get(
  '/:id',
  validateParams(listingIdParamsSchema),
  controller.getMine,
);
institutionListingsRouter.post('/', validateBody(createListingSchema), controller.createMine);
institutionListingsRouter.put(
  '/:id',
  validateParams(listingIdParamsSchema),
  validateBody(updateListingSchema),
  controller.updateMine,
);
institutionListingsRouter.delete(
  '/:id',
  validateParams(listingIdParamsSchema),
  controller.deleteMine,
);

export const institutionsPublicRouter = Router();

institutionsPublicRouter.get('/:id', validateParams(idParams), controller.getInstitution);
institutionsPublicRouter.get(
  '/:id/listings',
  validateParams(idParams),
  validateQuery(listingListQuerySchema),
  controller.listInstitutionListings,
);

export default router;
