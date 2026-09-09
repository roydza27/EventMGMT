# MEMORY.md

# College Event Management System — Project Memory

Last updated: 2026-09-09

---

## Current State

Phase: P1 — Database

Current task: Task 1 completed (Prisma Database Foundation established)

Overall status: Database foundation and core constraints implemented and verified


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

Status: Not started

Completed:
- None

### P1 — Database

Status: In Progress

Completed:
- P1.1 Initialize PostgreSQL connection & Prisma datasource
- P1.2 Create initial Prisma migration (20260909095016_init_database_foundation)
- P1.3 Model User entity (STUDENT, ORGANIZER, ADMIN, unique email, password hash, college)
- P1.5 Model Event entity (DRAFT, PUBLISHED, COMPLETED, CANCELLED, organizer relation, temporal rules)
- P1.6 Model Registration entity (ACTIVE, CANCELLED, user and event relations)
- P1.7 Partial unique index on (userId, eventId) WHERE status = 'ACTIVE' for active registration uniqueness with historical cancellation support
- Check constraints for startTime < endTime, registrationDeadline < startTime, and capacity > 0
- prisma/seed.ts with deterministic test accounts, events, and registrations
- tests/db-integrity.test.ts with 9 passing automated integrity tests


### P2 — Authentication & RBAC

Status: Not started

Completed:
- None

### P3 — Event Management

Status: Not started

Completed:
- None

### P4 — Event Discovery

Status: Not started

Completed:
- None

### P5 — Registration

Status: Not started

Completed:
- None

### P6 — Frontend

Status: Not started

Completed:
- None

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