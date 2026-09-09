# Registrations API Tests (`apps/api/tests/registrations/`)

## Scope & Purpose
This directory contains API contract and integration test specifications for student event registration and cancellation endpoints.

---

## Planned Test Cases

### 1. Event Registration (`POST /api/events/:id/register`)
- **Happy Path:** Authenticated `STUDENT` successfully registers for a published event; returns `201 Created` with `status: "ACTIVE"`.
- **Duplicate Active Registration:** Student attempting to register for the same event while holding an active registration receives `409 Conflict` (`REGISTRATION_DUPLICATE`).
- **Multiple Events:** Student can register for multiple distinct events without arbitrary global limits.
- **Unpublished / Cancelled Event:** Attempting to register for a `DRAFT` or `CANCELLED` event returns `404 Not Found` or `400 Bad Request`.
- **Deadline Passed:** Registration attempt after `event.registrationDeadline` returns `400 Bad Request` (`REGISTRATION_DEADLINE_PASSED`).
- **Capacity Limit:** When an event reaches maximum capacity, further registration attempts return `409 Conflict` (`REGISTRATION_CAPACITY_EXCEEDED`).
- **Concurrent Registration Race:** Concurrent registration attempts at capacity boundary do not exceed configured capacity.
- **Role Enforcement:** Non-students (`ORGANIZER`, `ADMIN`) attempting to register receive `403 Forbidden`.

### 2. Registration Cancellation (`POST /api/registrations/:id/cancel`)
- **Happy Path:** Student cancels their own active registration; registration updates to `status: "CANCELLED"` and is retained for history.
- **Already Cancelled:** Attempting to cancel an already cancelled registration returns `409 Conflict` (`REGISTRATION_ALREADY_CANCELLED`).
- **Non-Owner Denial:** A student attempting to cancel another student's registration receives `404 Not Found`.
- **Re-Registration After Cancellation:** A student who previously cancelled may register again for the same event if capacity and deadline allow.

### 3. Student Registration Roster (`GET /api/registrations/me`)
- **Happy Path:** Returns array of all active and cancelled registrations for the authenticated student, including event summary.
- **Isolation:** Never returns registrations belonging to other students.

---

## Prerequisites
- Requires completion of Task 1 (Registration schema & partial unique index), Task 2 (RegistrationStatus, RegistrationDTO), and Task 3 (auth middleware).
