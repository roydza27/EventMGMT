import { Router, Request, Response, NextFunction } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { loginSchema, refreshSchema, logoutSchema } from './auth.schema.js';

const router: Router = Router();

router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post(
  '/logout',
  (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return authenticate(req, res, next);
    }
    if (req.body?.refreshToken) {
      return next();
    }
    return authenticate(req, res, next);
  },
  validateRequest(logoutSchema),
  authController.logout
);
router.get('/me', authenticate, authController.me);

export const authRoutes: Router = router;
export default router;
