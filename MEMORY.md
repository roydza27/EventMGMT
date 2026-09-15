# MEMORY.md

# College Event Management System — Project Memory

Last updated: 2026-09-09

---

## Current State

Phase: P5 & P6 — Registration and Frontend

Current task: Event Registration API & Frontend Login / Registration Pages implemented and verified

Overall status: Event discovery, event registration API, and frontend authentication & registration interfaces completed. 73 total backend tests passing across all test suites (infrastructure: 8, auth: 17, event management: 19, event discovery: 17, registration: 12). Live frontend verified with zero TypeScript errors.


---

## Architecture

Frontend:
- Next.js
- TypeScript
- Tailwind CSS

Backend:
- Express
- TypeScript

Database:
- PostgreSQL

ORM:
- Prisma

Authentication:
- JWT access tokens
- Refresh tokens
- Password hashing

Architecture:
- Modular monolith

Repository:
- Monorepo

---

## Repository Structure

apps/web/
- Next.js frontend

apps/api/
- Express backend

packages/shared/
- Shared TypeScript types/constants

prisma/
- Prisma schema
- migrations
- seed

tests/e2e/
- End-to-end tests

---

## Confirmed Roles

STUDENT
ORGANIZER
ADMIN

No additional roles are currently approved.

---

## Confirmed Registration Rules

- Students may register for multiple different events.
- One active registration per student per event.
- No global registration limit.
- Overlapping event schedules do not automatically block registration.
- Students may come from different colleges.
- Events may restrict eligibility.
- Students can cancel/withdraw active registrations.
- Cancelled registrations may be retained for history.

---

## Event Lifecycle

DRAFT → PUBLISHED → COMPLETED

PUBLISHED → CANCELLED

FULL and REGISTRATION CLOSED are availability states, not lifecycle states.

---

## Current MVP Entities

User
Event
Registration

Team / TeamMember are NOT currently implemented.

---

## Important Database Rules

Event:

startTime < endTime

registrationDeadline < startTime

Registration:

At most one ACTIVE registration for:

(userId, eventId)

Prefer PostgreSQL enforcement through a partial unique index.

---

## Authorization Rules

Organizer:
- Can create events.
- Can manage own events.
- Cannot manage another organizer's events.

Admin:
- Can manage authorized system-wide resources.

Student:
- Can discover published events.
- Can register.
- Can view own registrations.
- Can cancel own active registrations.

Authorization is enforced by the backend.

---

## Runtime Source of Truth

PostgreSQL is authoritative for runtime data.

Do not store runtime events, users, or registrations in JSON.

GitHub stores source code and database migrations, not runtime application state.

---

## Confirmed MVP Exclusions

- AI chatbot
- WhatsApp / Telegram
- Social publishing
- Payments
- QR attendance
- Certificates
- Recommendation engine
- Gamification
- Advanced analytics
- Complex notification system
- Microservices
- Team registration
- Waitlists
- Attendance tracking

---

## Open Requirements

These are intentionally unresolved:

- Exact event categories
- Team/group participation
- Detailed eligibility representation
- Attendance scope
- Event-specific edge cases not yet documented

Do not turn these into implementation assumptions.

---

## Implementation Progress

### P0 — Foundation

Status: In Progress

Completed:
- Task 2: Establish Shared Domain Types and Enums (`@eventmgmt/shared`)
  - Enums: `UserRole` (STUDENT, ORGANIZER, ADMIN), `EventStatus` (DRAFT, PUBLISHED, COMPLETED, CANCELLED), `RegistrationStatus` (ACTIVE, CANCELLED)
  - Public domain types: `User`, `Event`, `Registration` (safe public shapes omitting sensitive credentials like passwordHash/refreshToken)
  - Relationship and summary shapes: `UserSummary`, `EventSummary`, `EventWithOrganizer`, `RegistrationWithEvent`, `RegistrationWithStudent`
  - Input contracts: `CreateEventInput`, `UpdateEventInput`, `CreateRegistrationInput` (omitting server-owned fields)
  - API response and error contracts: `ApiError`, `ApiErrorPayload`, `ApiErrorResponse`, `ApiSuccessResponse`, `ApiResponse<T>`, `ApiErrorCode`, plus endpoint response interfaces aligned with `06 — API Contracts`
  - Package exports: Configured `packages/shared/src/index.ts` barrel export and `packages/shared/package.json` with ESM subpath exports
  - Validation: Clean compilation with strict TypeScript `tsc` without any Prisma coupling
- Task 3: Establish Backend Application Foundation (`apps/api`)
  - Configuration: Centralized `apps/api/src/config/env.ts` with Zod schema and dotenv loading (fail-fast validation)
  - Logging: Structured logger in `apps/api/src/lib/logger.ts` supporting info/warn/error/debug with sensitive credential/token redaction
  - Error Model: AppError and subclasses (NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError) with standard API contract JSON response formatting in `apps/api/src/middleware/error.middleware.ts`
  - Request Validation: Reusable Zod validation middleware `apps/api/src/middleware/validation.middleware.ts` supporting body, query, and params validation
  - Security & Authentication Utils: Argon2id password hashing/verification (`apps/api/src/lib/password.ts`), JWT access/refresh token sign and verify (`apps/api/src/lib/jwt.ts`)
  - Middleware Boundaries: Token authentication boundary `authenticate` in `apps/api/src/middleware/auth.middleware.ts`, role guard `requireRole` in `apps/api/src/middleware/role.middleware.ts`
  - Bootstrap: Express application construction in `apps/api/src/app.ts` separated from HTTP listener in `apps/api/src/server.ts`, with CORS, Helmet, request logging, `/health` endpoint, and 404 handler
  - Validation: Automated test suite `apps/api/tests/infrastructure.test.ts` (8/8 tests passing covering health, 404, error handler, validation, password, JWT, auth middleware, and role guard)
  - Strict Isolation: Zero modifications to `prisma/**` and `packages/shared/**`
- Task 4: Establish API Documentation and Test Scaffolding
  - API Specification: Comprehensive REST API reference in `docs/api.md` covering `/api/auth`, `/api/events`, `/api/registrations`, `/api/participants`, response envelopes, HTTP status codes, standard error codes, authorization matrix, and explicit TBD boundaries.
  - Test Scaffolding & Documentation: Established backend test suite architecture in `apps/api/tests/README.md` and module-specific test documentation in `apps/api/tests/auth/README.md`, `apps/api/tests/events/README.md`, `apps/api/tests/registrations/README.md`, and `apps/api/tests/participants/README.md`.
  - Developer & Root Docs: Updated `README.md` with system overview, architecture links, and quick execution commands; established `docs/development.md` documenting testing layers, workflow rules, and integration test prerequisites.
  - Strict Isolation: Zero changes to `prisma/**`, `packages/shared/**`, `apps/api/src/config/**`, `apps/api/src/lib/**`, `apps/api/src/middleware/**`, `apps/api/src/app.ts`, `apps/api/src/server.ts`, or business modules.

### P1 — Database

Status: In Progress

Completed:
- P1.1 Initialize PostgreSQL connection & Prisma datasource
- P1.2 Create initial Prisma migration (20260909095016_init_database_foundation)
- P1.3 Model User entity (STUDENT, ORGANIZER, ADMIN, unique email, password hash, college)
- P1.5 Model Event entity (DRAFT, PUBLISHED, COMPLETED, CANCELLED, organizer relation, temporal rules)
- P1.6 Model Registration entity (ACTIVE, CANCELLED, user and event relations)
- P1.7 Partial unique index on (userId, eventId) WHERE status = 'ACTIVE' for active registration uniqueness with historical cancellation support
- P1.4 Model refresh-token persistence (RefreshToken entity with tokenHash, expiration, revocation, replacement tracking, and cascade deletion)
- Prisma migration (20260909101557_add_refresh_token_persistence)
- Check constraints for startTime < endTime, registrationDeadline < startTime, and capacity > 0
- prisma/seed.ts with deterministic test accounts, events, and registrations
- tests/db-integrity.test.ts with 9 passing automated integrity tests

### P2 — Authentication & RBAC

Status: Completed

Completed:
- P2.1 Implement password hashing service with Argon2id (`apps/api/src/lib/password.ts`)
- P2.2 Implement JWT access-token service (`apps/api/src/lib/jwt.ts`)
- P2.3 Implement refresh-token service with database persistence, rotation, expiration, and replay detection (`apps/api/src/modules/auth/auth.service.ts`)
- P2.4 Implement authentication context middleware (`apps/api/src/middleware/auth.middleware.ts`)
- P2.5 Implement role guard middleware (`apps/api/src/middleware/role.middleware.ts`)
- P2.6 Implement login endpoint `POST /api/auth/login` (`apps/api/src/modules/auth/auth.controller.ts`, `auth.routes.ts`)
- P2.7 Implement refresh endpoint `POST /api/auth/refresh` with rotation & replay protection
- P2.8 Implement logout endpoint `POST /api/auth/logout` with session invalidation
- P2.9 Implement current-user endpoint `GET /api/auth/me` with server-derived identity
- P2.10 Add comprehensive authentication & RBAC integration tests (`apps/api/tests/auth/auth.test.ts`, 17/17 passing)

### P3 — Event Management

Status: In Progress

Completed:
- Task 6: Implement Event Management (`apps/api/src/modules/events/`)
  - Schema validation (`event.schema.ts`): Zod schemas enforcing required fields, temporal invariants (`startTime < endTime`, `registrationDeadline < startTime`), and positive capacity.
  - Event Service (`event.service.ts`):
    - `createEvent`: Enforces `DRAFT` initial state, derives `organizerId` from authenticated session.
    - `getEventById`: Conceals private `DRAFT` events from students and non-owner organizers (returns 404); allows owner and admin.
    - `listEvents`: Returns only `PUBLISHED` events to students and unauthenticated users; organizers see published + owned drafts; admins see all.
    - `updateEvent`: Server-side ownership check (only owner organizer or admin can mutate); revalidates temporal rules; preserves lifecycle status.
    - `publishEvent`: Transitions `DRAFT -> PUBLISHED`; rejects invalid transitions on already published, cancelled, or completed events with 409 Conflict.
    - `cancelEvent`: Transitions to `CANCELLED`; rejects cancelling completed or already cancelled events with 409 Conflict.
  - Controller & Routes (`event.controller.ts`, `event.routes.ts`): Mounted under `/api/events` in `app.ts` using existing `authenticate` and `requireRole` boundaries.
  - Integration Tests (`apps/api/tests/events/event-management.test.ts`): 19/19 tests passing covering creation, ownership enforcement, lifecycle transitions, validation rules, and visibility.
  - Task Isolation: Zero modifications to authentication implementation (Task 5), password utilities, JWT logic, or unrelated Prisma schemas.


### P4 — Event Discovery

Status: Completed

Completed:
- Task 7: Implement Event Discovery (`apps/api/src/modules/events/`)
  - Schema validation (`event.schema.ts`): Added `eventQuerySchema` validating optional `search`, `category`, `from`, `to`, and `status` query parameters with ISO datetime coercion.
  - Discovery Service (`event.service.ts`):
    - `calculateAvailability`: Derived registration availability states (`OPEN`, `FULL`, `REGISTRATION_CLOSED`, `CANCELLED`, `COMPLETED`) based on event status, deadline, capacity, and active registrations.
    - `getEventById`: Augmented detail payload with `activeRegistrationCount` and derived `availability`.
    - `listEvents`: Implemented search across `title`, `description`, and `venue` (case-insensitive with Prisma `mode: 'insensitive'`), exact `category` match, and `from`/`to` timestamp filters on `startTime`.
    - Visibility Guard: Automatically restricts catalog listing to `status: PUBLISHED` for student and unauthenticated public requests.
  - Routes & Controller (`event.routes.ts`, `event.controller.ts`): Attached `validateRequest({ query: eventQuerySchema })` to `GET /api/events` and propagated parsed filters.
  - Automated Integration Tests (`apps/api/tests/events/event-discovery.test.ts`): 17/17 tests passing covering:
    - Published open, full, and closed events visible in public catalog
    - Draft and cancelled events hidden from public and student catalogs
    - Query parameter `status=DRAFT` or `status=CANCELLED` cannot bypass visibility rules for public/student
    - Search across title, description, and venue (case-insensitive)
    - Category filtering
    - Date range filtering (`from`/`to`)
    - 400 Bad Request on invalid date format
    - Availability states derived correctly: `OPEN`, `FULL`, `REGISTRATION_CLOSED`, `CANCELLED`
    - Active registration count attached to list items and detail view
    - 404 Not Found for draft events accessed by unauthenticated/student users
    - 404 Not Found for nonexistent event UUIDs
    - 400 Bad Request for invalid UUID format
  - Task Isolation: Zero modifications to auth implementation (Task 5), shared contracts, or database schema.

### P5 — Registration

Status: Completed

Completed:
- Task: Implement Event Registration & Cancellation Workflows (`apps/api/src/modules/registrations/`)
  - Registration Service (`registration.service.ts`):
    - `register`: Enforces student role, event published state, deadline non-expiry, single active registration per student per event, and transactional capacity limits. Emits 201 Created with status `ACTIVE`.
    - `cancel`: Allows students to withdraw active passes. Enforces ownership check, prevents cancelling already cancelled records, and preserves historical record with status `CANCELLED`.
    - `getMyRegistrations`: Retrieves authenticated student's registrations with associated event details.
  - Controller & Routes (`registration.controller.ts`, `registration.routes.ts`, `event.routes.ts`):
    - `POST /api/events/:id/register`: Authenticated student registration endpoint.
    - `POST /api/registrations/:id/cancel`: Authenticated student cancellation endpoint.
    - `GET /api/registrations/me`: Authenticated student registrations roster.
  - Automated Integration Tests (`apps/api/tests/registrations/registration.test.ts`): 12/12 tests passing covering registration, duplicate rejection, deadline rejection, role guard, capacity boundaries, self-cancellation, double cancellation prevention, non-owner denial, and re-registration after withdrawal.

### P6 — Frontend

Status: In Progress

Completed:
- Public & Student Authentication (`apps/web/app/(auth)/login/page.tsx`): Form validation, error feedback, quick-fill demo cards for Student, Organizer, and Admin, and redirect preservation.
- Account Registration UI (`apps/web/app/(auth)/register/page.tsx`): Campus pass creation form with role selection and institutional validation.
- Student Registrations Management (`apps/web/app/(student)/registrations/page.tsx`): Full roster UI displaying active and withdrawn passes, event metadata, cancellation with confirmation, summary metric cards, and filter controls.
- API Client Integration (`apps/web/lib/api.ts`, `apps/web/lib/auth.ts`): Authenticated request client with token storage and methods for auth, events, and registration endpoints.

### P7 — Participant APIs

Status: Not started

Completed:
- None

### P8 — Validation & Deployment

Status: Not started

Completed:
- None

---

## Active Decisions

### Decision: Modular Monolith

Reason:
The MVP does not justify distributed services.

### Decision: Individual Registration

Reason:
Team participation has not been confirmed.

### Decision: PostgreSQL Runtime Source of Truth

Reason:
Events, users, registrations and state changes require authoritative persistent storage.

### Decision: Backend Authorization

Reason:
Frontend visibility is not a security boundary.

### Decision: JWT + Refresh Tokens

Reason:
Confirmed authentication direction for the application.

---

## Known Issues

None currently.

---

## Agent Notes

This file is a state snapshot, not a complete specification.

For detailed requirements, consult the relevant project documentation.

For execution order, consult the implementation task list.

For repository operating rules, consult AGENTS.md.

## Notion Context

Primary project documentation:
- College Event Management System

Notion documentation is the authoritative source for:
- Requirements
- Business rules
- API contracts
- Security
- Database specification
- Implementation tasks

Use Notion MCP to retrieve detailed context.

Do not duplicate full Notion documentation in this file.