# Participant Management API Tests (`apps/api/tests/participants/`)

## Scope & Purpose
This directory contains API contract and integration test specifications for organizer and admin participant management endpoints (`/api/events/:id/participants`).

---

## Planned Test Cases

### 1. Participant Listing (`GET /api/events/:id/participants`)
- **Organizer Happy Path:** Organizer requests participant roster for an event they created; receives `200 OK` with list of registrations containing student profile (`name`, `email`, `college`) and registration status.
- **Admin System Access:** Administrator can access participant rosters for any event.
- **Non-Owner Denial:** An organizer attempting to view participant rosters for another organizer's event receives `403 Forbidden`.
- **Student Denial:** A student attempting to access the participant endpoint receives `403 Forbidden`.
- **Non-Existent Event:** Request for non-existent event returns `404 Not Found`.

---

## Prerequisites
- Requires completion of Task 1 (User, Event, Registration relations), Task 2 (Participant response shapes), and Task 3 (role guard & auth middleware).
