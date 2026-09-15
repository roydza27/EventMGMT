import { Request, Response, NextFunction } from 'express';
import { eventService } from './event.service.js';
import { EventFilterQuery } from './event.types.js';

export const eventController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = req.user!.userId;
      const event = await eventService.createEvent(req.body, organizerId);
      res.status(201).json({ event });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.getEventById(req.params.id, req.user);
      res.status(200).json({ event });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await eventService.listEvents(req.query as EventFilterQuery, req.user);
      res.status(200).json({ events });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.updateEvent(req.params.id, req.body, req.user!);
      res.status(200).json({ event });
    } catch (error) {
      next(error);
    }
  },

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.publishEvent(req.params.id, req.user!);
      res.status(200).json({ event });
    } catch (error) {
      next(error);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.cancelEvent(req.params.id, req.user!);
      res.status(200).json({ event });
    } catch (error) {
      next(error);
    }
  },
};
