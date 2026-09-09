import { Event, EventStatus, CreateEventInput, UpdateEventInput } from '@eventmgmt/shared';

export type { Event, CreateEventInput, UpdateEventInput };
export { EventStatus };

export interface AuthenticatedUserContext {
  userId: string;
  role: string;
}

export interface EventFilterQuery {
  status?: EventStatus;
}
