# Events API Tests (`apps/api/tests/events/`)

## Scope & Purpose
This directory contains API contract and integration test specifications for the event management and discovery endpoints (`/api/events`).

---

## Planned Test Cases

### 1. Event Creation (`POST /api/events`)
- **Organizer Creation:** Authenticated organizer can create an event; event is created with initial status `DRAFT`.
- **Admin Creation:** Authenticated admin can create events.
- **Server-Derived Identity:** Verify `organizerId` is bound to authenticated user and client-supplied `organizerId` is ignored.
- **Temporal Invariant Validation:**
  - `startTime >= endTime` returns `400 Bad Request`.
  - `registrationDeadline >= startTime` returns `400 Bad Request`.
- **Capacity Invariant:** Negative or zero capacity returns `400 Bad Request`.
- **Role Denial:** `STUDENT` attempting event creation receives `403 Forbidden`.

### 2. Event Discovery & Visibility (`GET /api/events`, `GET /api/events/:id`)
- **Student Catalog:** Ordinary students only receive events with `status: "PUBLISHED"`.
- **Draft Event Concealment:** Draft events return `404 Not Found` to students.
- **Cancelled Event Handling:** Cancelled events are excluded or clearly flagged according to discovery rules.
- **Search & Filter:** Query parameters (`search`, `category`, `from`, `to`) correctly filter published results.

### 3. Event Mutation (`PUT /api/events/:id`)
- **Owner Mutation:** Organizer who created the event can update allowed metadata fields.
- **Non-Owner Denial:** Another organizer attempting to edit an event receives `403 Forbidden`.
- **Admin Override:** Admin can update any event.

### 4. Lifecycle Transitions (`POST /api/events/:id/publish`, `POST /api/events/:id/cancel`)
- **Publish Transition:** `DRAFT` transitions to `PUBLISHED` when required fields are valid.
- **Cancel Transition:** `PUBLISHED` transitions to `CANCELLED`; once cancelled, event rejects new registrations.
- **Invalid Transitions:** Attempting to publish an already published or cancelled event returns `409 Conflict`.
- **Ownership Verification:** Non-owner organizers cannot publish or cancel another organizer's event (`403 Forbidden`).

---

## Prerequisites
- Requires completion of Task 1 (Event schema & constraints), Task 2 (shared event types/enums), and Task 3 (role & auth guards).
