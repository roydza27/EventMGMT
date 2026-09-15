import { Request, Response, NextFunction } from 'express';
import { registrationService } from './registration.service.js';

export const registrationController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registration = await registrationService.register(req.params.id, req.user!);
      res.status(201).json({ registration });
    } catch (error) {
      next(error);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registration = await registrationService.cancel(req.params.id, req.user!);
      res.status(200).json({ registration });
    } catch (error) {
      next(error);
    }
  },

  async getMyRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const registrations = await registrationService.getMyRegistrations(req.user!.userId);
      res.status(200).json({ registrations });
    } catch (error) {
      next(error);
    }
  },
};
