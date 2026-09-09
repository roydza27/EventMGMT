import { UserRole, EventStatus, RegistrationStatus } from './enums.js';

/**
 * Public/user-facing representation of a User.
 * Sensitive fields (password, passwordHash, refreshToken) are intentionally omitted.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  role: UserRole;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

/**
 * Compact user representation for embedded relationship summaries.
 */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  college: string;
  role?: UserRole;
}

/**
 * Event domain representation matching the confirmed MVP requirements.
 */
export interface Event {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  category: string;
  startTime: Date | string;
  endTime: Date | string;
  venue: string;
  capacity: number | null;
  registrationDeadline: Date | string;
  eligibility: string;
  prize: string | null;
  status: EventStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Compact event representation for registration listings and summaries.
 */
export interface EventSummary {
  id: string;
  title: string;
  category?: string;
  startTime: Date | string;
  endTime: Date | string;
  venue: string;
  status?: EventStatus;
}

/**
 * Individual student's registration for an event.
 */
export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: RegistrationStatus;
  registeredAt: Date | string;
  cancelledAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Event with embedded organizer information.
 */
export interface EventWithOrganizer extends Event {
  organizer: Pick<User, 'id' | 'name' | 'email' | 'college'>;
}

/**
 * Student's registration with embedded event details (e.g. for /api/registrations/me).
 */
export interface RegistrationWithEvent extends Registration {
  event: EventSummary;
}

/**
 * Registration record with embedded student details (e.g. for /api/events/:id/participants).
 */
export interface RegistrationWithStudent extends Registration {
  student: Pick<User, 'id' | 'name' | 'email' | 'college'>;
}

/**
 * Input for creating a new event.
 * Server-owned fields (id, organizerId, status, timestamps) are omitted.
 */
export interface CreateEventInput {
  title: string;
  description: string;
  category: string;
  startTime: Date | string;
  endTime: Date | string;
  venue: string;
  capacity?: number | null;
  registrationDeadline: Date | string;
  eligibility: string;
  prize?: string | null;
}

/**
 * Input for updating an existing event.
 * All editable fields are optional.
 */
export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  venue?: string;
  capacity?: number | null;
  registrationDeadline?: Date | string;
  eligibility?: string;
  prize?: string | null;
}

/**
 * Input for creating a registration.
 * Student identity is derived from authenticated session.
 */
export interface CreateRegistrationInput {
  eventId?: string;
}

/**
 * Backward compatibility aliases.
 */
export type UserDTO = User;
export type EventDTO = Event;
export type RegistrationDTO = Registration;
