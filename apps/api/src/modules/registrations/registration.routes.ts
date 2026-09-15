import { Router } from 'express';
import { registrationController } from './registration.controller.js';
import { registrationIdParamSchema } from './registration.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router: Router = Router();

// GET /api/registrations/me
router.get('/me', authenticate, registrationController.getMyRegistrations);

// POST /api/registrations/:id/cancel
router.post(
  '/:id/cancel',
  authenticate,
  validateRequest({ params: registrationIdParamSchema }),
  registrationController.cancel
);

export const registrationRoutes: Router = router;
export default router;
