import { Router, Request, Response, NextFunction } from 'express';
import { eventController } from './event.controller.js';
import { registrationController } from '../registrations/registration.controller.js';
import { createEventSchema, updateEventSchema, eventIdParamSchema, eventQuerySchema } from './event.schema.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router: Router = Router();

function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  if (req.headers.authorization) {
    authenticate(req, res, next);
  } else {
    next();
  }
}

// 1. List events (with search, category, date filters, role-based visibility)
router.get(
  '/',
  optionalAuthenticate,
  validateRequest({ query: eventQuerySchema }),
  eventController.list
);

// 2. Get event by ID (with active registration count and availability)
router.get(
  '/:id',
  optionalAuthenticate,
  validateRequest({ params: eventIdParamSchema }),
  eventController.getById
);

// 3. Create event (Organizer / Admin only)
router.post(
  '/',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  validateRequest(createEventSchema),
  eventController.create
);

// 4. Update event (Owner Organizer / Admin only)
router.put(
  '/:id',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  validateRequest({ params: eventIdParamSchema, body: updateEventSchema }),
  eventController.update
);

// 5. Publish event (Owner Organizer / Admin only)
router.post(
  '/:id/publish',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  validateRequest({ params: eventIdParamSchema }),
  eventController.publish
);

// 6. Cancel event (Owner Organizer / Admin only)
router.post(
  '/:id/cancel',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  validateRequest({ params: eventIdParamSchema }),
  eventController.cancel
);

// 7. Register for event (Student only)
router.post(
  '/:id/register',
  authenticate,
  requireRole('STUDENT'),
  validateRequest({ params: eventIdParamSchema }),
  registrationController.register
);

export const eventRoutes: Router = router;
export default router;
