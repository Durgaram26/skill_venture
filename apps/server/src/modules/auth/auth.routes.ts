import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import * as authController from './auth.controller.js';
import {
  googleAuthSchema,
  loginSchema,
  registerInstitutionSchema,
  registerStudentSchema,
  updateProfileSchema,
} from './auth.validation.js';

const router = Router();

router.post(
  '/register/student',
  authRateLimiter,
  validateBody(registerStudentSchema),
  authController.registerStudent,
);

router.post(
  '/register/institution',
  authRateLimiter,
  validateBody(registerInstitutionSchema),
  authController.registerInstitution,
);

router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);

router.post('/refresh', authRateLimiter, authController.refresh);

router.post('/logout', authController.logout);

router.post('/google', authRateLimiter, validateBody(googleAuthSchema), authController.googleAuth);

router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validateBody(updateProfileSchema), authController.updateMe);

export default router;
