import { prisma } from '../../config/database.js';
import {
  EventStatus,
  CreateEventInput,
  UpdateEventInput,
  AuthenticatedUserContext,
  EventFilterQuery,
  EventAvailability,
} from './event.types.js';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../middleware/error.middleware.js';

export function calculateAvailability(
  event: { status: EventStatus | string; registrationDeadline: Date | string; capacity: number | null },
  activeCount: number
): EventAvailability {
  if (event.status === EventStatus.CANCELLED) {
    return 'CANCELLED';
  }
  if (event.status === EventStatus.COMPLETED) {
    return 'COMPLETED';
  }
  if (new Date() >= new Date(event.registrationDeadline)) {
    return 'REGISTRATION_CLOSED';
  }
  if (event.capacity !== null && activeCount >= event.capacity) {
    return 'FULL';
  }
  return 'OPEN';
}

export const eventService = {
  async createEvent(input: CreateEventInput, organizerId: string) {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    const registrationDeadline = new Date(input.registrationDeadline);

    if (startTime >= endTime) {
      throw new ValidationError('Start time must be before end time');
    }

    if (registrationDeadline >= startTime) {
      throw new ValidationError('Registration deadline must be before start time');
    }

    if (input.capacity !== undefined && input.capacity !== null && input.capacity <= 0) {
      throw new ValidationError('Capacity must be greater than 0');
    }

    const event = await prisma.event.create({
      data: {
        organizerId,
        title: input.title,
        description: input.description,
        category: input.category,
        startTime,
        endTime,
        venue: input.venue,
        capacity: input.capacity ?? null,
        registrationDeadline,
        eligibility: input.eligibility,
        prize: input.prize ?? null,
        status: EventStatus.DRAFT,
      },
    });

    return event;
  },

  async getEventById(id: string, user?: AuthenticatedUserContext) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Conceal DRAFT events from users who are neither the owner nor an admin
    if (event.status === EventStatus.DRAFT) {
      const isOwner = user?.userId === event.organizerId;
      const isAdmin = user?.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        throw new NotFoundError('Event not found');
      }
    }

    const activeRegistrationCount = event._count?.registrations ?? 0;
    const availability = calculateAvailability(event, activeRegistrationCount);

    const { _count, ...eventData } = event;
    return {
      ...eventData,
      activeRegistrationCount,
      availability,
    };
  },

  async listEvents(filter?: EventFilterQuery, user?: AuthenticatedUserContext) {
    const where: any = {};

    // 1. Base visibility rules according to authenticated role
    if (user?.role === 'ADMIN') {
      if (filter?.status) {
        where.status = filter.status;
      }
    } else if (user?.role === 'ORGANIZER') {
      if (filter?.status) {
        if (filter.status === EventStatus.DRAFT) {
          where.status = EventStatus.DRAFT;
          where.organizerId = user.userId;
        } else {
          where.status = filter.status;
        }
      } else {
        where.OR = [
          { status: { not: EventStatus.DRAFT } },
          { organizerId: user.userId },
        ];
      }
    } else {
      // Student or public catalog: strictly PUBLISHED events
      where.status = EventStatus.PUBLISHED;
    }

    // 2. Search query filter across title, description, and venue
    if (filter?.search) {
      const searchPattern = filter.search;
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: searchPattern, mode: 'insensitive' } },
          { description: { contains: searchPattern, mode: 'insensitive' } },
          { venue: { contains: searchPattern, mode: 'insensitive' } },
        ],
      });
    }

    // 3. Category filter
    if (filter?.category) {
      where.category = { equals: filter.category, mode: 'insensitive' };
    }

    // 4. Date range filter
    if (filter?.from || filter?.to) {
      where.startTime = {};
      if (filter.from) {
        where.startTime.gte = new Date(filter.from);
      }
      if (filter.to) {
        where.startTime.lte = new Date(filter.to);
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, college: true },
        },
        _count: {
          select: {
            registrations: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    return events.map((event) => {
      const activeRegistrationCount = event._count?.registrations ?? 0;
      const availability = calculateAvailability(event, activeRegistrationCount);
      const { _count, ...eventData } = event;
      return {
        ...eventData,
        activeRegistrationCount,
        availability,
      };
    });
  },

  async updateEvent(id: string, input: UpdateEventInput, user: AuthenticatedUserContext) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Ownership check: organizer can only edit own event; admin can edit any
    if (user.role !== 'ADMIN' && event.organizerId !== user.userId) {
      throw new ForbiddenError('You do not have permission to edit this event');
    }

    // Temporal revalidation
    const effectiveStart = input.startTime ? new Date(input.startTime) : event.startTime;
    const effectiveEnd = input.endTime ? new Date(input.endTime) : event.endTime;
    const effectiveDeadline = input.registrationDeadline ? new Date(input.registrationDeadline) : event.registrationDeadline;

    if (effectiveStart >= effectiveEnd) {
      throw new ValidationError('Start time must be before end time');
    }

    if (effectiveDeadline >= effectiveStart) {
      throw new ValidationError('Registration deadline must be before start time');
    }

    if (input.capacity !== undefined && input.capacity !== null && input.capacity <= 0) {
      throw new ValidationError('Capacity must be greater than 0');
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.startTime !== undefined && { startTime: effectiveStart }),
        ...(input.endTime !== undefined && { endTime: effectiveEnd }),
        ...(input.venue !== undefined && { venue: input.venue }),
        ...(input.capacity !== undefined && { capacity: input.capacity }),
        ...(input.registrationDeadline !== undefined && { registrationDeadline: effectiveDeadline }),
        ...(input.eligibility !== undefined && { eligibility: input.eligibility }),
        ...(input.prize !== undefined && { prize: input.prize }),
      },
    });

    return updated;
  },

  async publishEvent(id: string, user: AuthenticatedUserContext) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Ownership check
    if (user.role !== 'ADMIN' && event.organizerId !== user.userId) {
      throw new ForbiddenError('You do not have permission to publish this event');
    }

    // Lifecycle validation: DRAFT -> PUBLISHED
    if (event.status === EventStatus.PUBLISHED) {
      throw new ConflictError('Event is already published');
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new ConflictError('Cannot publish a cancelled event');
    }

    if (event.status === EventStatus.COMPLETED) {
      throw new ConflictError('Cannot publish a completed event');
    }

    // Validate required fields before publishing
    if (!event.title || !event.description || !event.venue || !event.startTime || !event.endTime || !event.registrationDeadline) {
      throw new ValidationError('Event cannot be published with missing required fields');
    }

    const published = await prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED },
    });

    return published;
  },

  async cancelEvent(id: string, user: AuthenticatedUserContext) {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Ownership check
    if (user.role !== 'ADMIN' && event.organizerId !== user.userId) {
      throw new ForbiddenError('You do not have permission to cancel this event');
    }

    // Lifecycle validation: Cannot cancel an already cancelled or completed event
    if (event.status === EventStatus.CANCELLED) {
      throw new ConflictError('Event is already cancelled');
    }

    if (event.status === EventStatus.COMPLETED) {
      throw new ConflictError('Cannot cancel a completed event');
    }

    const cancelled = await prisma.event.update({
      where: { id },
      data: { status: EventStatus.CANCELLED },
    });

    return cancelled;
  },
};
