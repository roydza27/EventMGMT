import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, NotFoundError } from './middleware/error.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { eventRoutes } from './modules/events/event.routes.js';
import { registrationRoutes } from './modules/registrations/registration.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 2. Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // 4. Infrastructure endpoints
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // 5. API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/registrations', registrationRoutes);

  // 6. 404 handler for unknown routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
  });

  // 7. Central error handling middleware
  app.use(errorHandler);

  return app;
}

export default createApp;
