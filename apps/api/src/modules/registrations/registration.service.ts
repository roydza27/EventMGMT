import { prisma } from '../../config/database.js';
import { AuthenticatedUserContext, RegistrationStatus } from './registration.types.js';
import { EventStatus } from '../events/event.types.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../middleware/error.middleware.js';

export const registrationService = {
  async register(eventId: string, user: AuthenticatedUserContext) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenError('Only students can register for events');
    }

    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      if (event.status !== EventStatus.PUBLISHED) {
        throw new ConflictError('Cannot register for an unpublished or cancelled event');
      }

      if (new Date() >= new Date(event.registrationDeadline)) {
        throw new ConflictError('Registration deadline has passed');
      }

      const existingActive = await tx.registration.findFirst({
        where: {
          userId: user.userId,
          eventId,
          status: RegistrationStatus.ACTIVE,
        },
      });

      if (existingActive) {
        throw new ConflictError('You already have an active registration for this event');
      }

      if (event.capacity !== null) {
        const activeCount = await tx.registration.count({
          where: {
            eventId,
            status: RegistrationStatus.ACTIVE,
          },
        });

        if (activeCount >= event.capacity) {
          throw new ConflictError('Event capacity has been reached');
        }
      }

      const registration = await tx.registration.create({
        data: {
          userId: user.userId,
          eventId,
          status: RegistrationStatus.ACTIVE,
        },
      });

      return registration;
    });
  },

  async cancel(registrationId: string, user: AuthenticatedUserContext) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (user.role !== 'ADMIN' && registration.userId !== user.userId) {
      throw new NotFoundError('Registration not found');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new ConflictError('Registration is already cancelled');
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.CANCELLED },
    });

    return updated;
  },

  async getMyRegistrations(userId: string) {
    return prisma.registration.findMany({
      where: { userId },
      orderBy: { registeredAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            startTime: true,
            endTime: true,
            venue: true,
            status: true,
            capacity: true,
            registrationDeadline: true,
          },
        },
      },
    });
  },
};
