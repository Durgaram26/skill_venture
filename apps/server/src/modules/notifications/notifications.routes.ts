import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import * as controller from './notifications.controller.js';

const listQuery = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    unreadOnly: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .optional()
      .transform((v) => v === true || v === 'true'),
  })
  .strict();

const idParams = z.object({ id: z.string().min(1) }).strict();

const pushBody = z
  .object({
    token: z.string().min(10).max(500),
    platform: z.enum(['web', 'android', 'ios']).optional(),
  })
  .strict();

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(listQuery), controller.listMine);
router.patch('/:id/read', validateParams(idParams), controller.markRead);
router.post('/push/register', validateBody(pushBody), controller.registerPush);

export default router;
