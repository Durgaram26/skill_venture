import { Router } from 'express';
import * as adminService from '../../modules/admin/admin.service.js';

const router = Router();

router.get('/settings', async (_req, res, next) => {
  try {
    const settings = await adminService.getPlatformSettings();
    res.status(200).json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
});

export default router;
