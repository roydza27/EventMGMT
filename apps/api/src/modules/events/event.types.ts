import { Event, EventStatus, CreateEventInput, UpdateEventInput } from '@eventmgmt/shared';

export type { Event, CreateEventInput, UpdateEventInput };
export { EventStatus };

export type EventAvailability = 'OPEN' | 'FULL' | 'REGISTRATION_CLOSED' | 'CANCELLED' | 'COMPLETED';

export interface EventDetailDTO extends Event {
  organizer: {
    id: string;
    name: string;
    email: string;
    college: string;
  };
  activeRegistrationCount: number;
  availability: EventAvailability;
}

export interface AuthenticatedUserContext {
  userId: string;
  role: string;
}

export interface EventFilterQuery {
  search?: string;
  category?: string;
  from?: Date | string;
  to?: Date | string;
  status?: EventStatus;
}
