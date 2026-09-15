export type EventStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
export type EventAvailability = "OPEN" | "FULL" | "REGISTRATION_CLOSED" | "CANCELLED" | "COMPLETED";
export type UserRole = "STUDENT" | "ORGANIZER" | "ADMIN";
export type RegistrationStatus = "ACTIVE" | "CANCELLED";

export interface OrganizerSummary {
  id: string;
  name: string;
  email: string;
  college: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number | null;
  registrationDeadline: string;
  eligibility: string;
  prize?: string | null;
  status: EventStatus;
  organizerId: string;
  organizer?: OrganizerSummary;
  activeRegistrationCount?: number;
  availability?: EventAvailability;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  role: UserRole;
  createdAt?: string;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt?: string | null;
  event?: Event;
  student?: OrganizerSummary;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens?: AuthTokens;
  accessToken?: string;
  refreshToken?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}
