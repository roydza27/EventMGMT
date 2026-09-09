import type {
  User,
  Event,
  Registration,
  RegistrationWithEvent,
  RegistrationWithStudent,
} from './types.js';

/**
 * Standard API error payload structure matching the project API specification:
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable explanation",
 *     "details": ... (optional)
 *   }
 * }
 */
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Direct alias for ApiErrorPayload.
 */
export type ApiError = ApiErrorPayload;

/**
 * Standard envelope for error responses.
 */
export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

/**
 * Standard wrapped success response payload.
 */
export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

/**
 * Generic API response representing either a successful result or an error response.
 */
export type ApiResponse<T> =
  | ({ error?: never } & T)
  | ApiErrorResponse;

/**
 * Confirmed standard error codes across the application.
 */
export const ApiErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  // Domain-specific error codes
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  EVENT_NOT_PUBLISHED: 'EVENT_NOT_PUBLISHED',
  EVENT_CANCELLED: 'EVENT_CANCELLED',
  REGISTRATION_DEADLINE_PASSED: 'REGISTRATION_DEADLINE_PASSED',
  REGISTRATION_DUPLICATE: 'REGISTRATION_DUPLICATE',
  REGISTRATION_CAPACITY_EXCEEDED: 'REGISTRATION_CAPACITY_EXCEEDED',
  REGISTRATION_NOT_ELIGIBLE: 'REGISTRATION_NOT_ELIGIBLE',
  REGISTRATION_ALREADY_CANCELLED: 'REGISTRATION_ALREADY_CANCELLED',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/**
 * Standard endpoint response shapes defined in 06 — API Contracts.
 */
export interface AuthResponse {
  user: User;
}

export interface EventListResponse {
  events: Event[];
}

export interface EventDetailResponse {
  event: Event;
}

export interface RegistrationResponse {
  registration: Registration;
}

export interface MyRegistrationsResponse {
  registrations: RegistrationWithEvent[];
}

export interface EventParticipantsResponse {
  eventId: string;
  registrations: RegistrationWithStudent[];
}
