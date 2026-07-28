import { Router } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
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
  validateBody(registerStudentSchema),
  authController.registerStudent,
);

router.post(
  '/register/institution',
  validateBody(registerInstitutionSchema),
  authController.registerInstitution,
);

router.post('/login', validateBody(loginSchema), authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.post('/google', validateBody(googleAuthSchema), authController.googleAuth);

router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validateBody(updateProfileSchema), authController.updateMe);

export default router;
