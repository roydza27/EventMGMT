# College Event Management System — API Specification

## 1. Overview & Principles

The College Event Management System backend is an Express-based RESTful API located in `apps/api`.
This document defines the HTTP API contracts shared between the backend (`apps/api`), frontend (`apps/web`), and consumer clients.

### Core Principles
- **Base URL Prefix:** All domain routes are mounted under `/api` (e.g. `/api/auth/login`, `/api/events`).
- **Data Format:** Request and response bodies are formatted as JSON unless specified otherwise (`Content-Type: application/json`).
- **Identifiers:** Primary entities use UUIDv4 strings.
- **Authentication:** JWT access tokens (short-lived) paired with refresh tokens (persisted session metadata for rotation/revocation).
- **Security Boundary:** All authorization and ownership checks are enforced server-side. Client-provided user or organizer identities are never trusted when they can be derived from the authenticated session.
- **Invariants:** Business rules (such as registration capacity, registration deadline, event lifecycle transitions, and active registration uniqueness) are validated by the backend domain logic and reinforced by PostgreSQL constraints.

---

## 2. API Response & Error Conventions

### Standard Success Response Shape
Endpoints return domain objects or resource arrays directly or under structured root keys:
```json
{
  "user": { ... }
}
```
or
```json
{
  "events": [ ... ]
}
```

### Standard Error Response Shape
All error responses adhere to a consistent structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation of the error",
    "details": null
  }
}
```
When validation fails (e.g. via Zod validation middleware), `details` contains an array of field-level validation issue objects:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email"
      }
    ]
  }
}
```

### HTTP Status Code Conventions
- `200 OK`: Successful read, update, or state transition action.
- `201 Created`: Resource successfully created.
- `204 No Content`: Successful action with no response body (e.g., logout).
- `400 Bad Request`: Malformed payload, invalid query parameter, or validation error.
- `401 Unauthorized`: Missing, invalid, or expired authentication token.
- `403 Forbidden`: Authenticated user lacks permission or does not own the target resource.
- `404 Not Found`: Target resource does not exist or is not visible to the requester.
- `409 Conflict`: Domain state conflict (e.g., duplicate active registration, event capacity exceeded, registration already cancelled).
- `422 Unprocessable Entity`: Semantically invalid request.
- `500 Internal Server Error`: Unexpected server exception. Error details and stack traces are never leaked to clients in production.

### Standard Error Codes
- `BAD_REQUEST`
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `NO_TOKEN_PROVIDED`
- `INVALID_TOKEN`
- `TOKEN_EXPIRED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INTERNAL_SERVER_ERROR`
- `EVENT_NOT_FOUND`
- `EVENT_NOT_PUBLISHED`
- `EVENT_CANCELLED`
- `REGISTRATION_DEADLINE_PASSED`
- `REGISTRATION_DUPLICATE`
- `REGISTRATION_CAPACITY_EXCEEDED`
- `REGISTRATION_NOT_ELIGIBLE`
- `REGISTRATION_ALREADY_CANCELLED`

---

## 3. Authentication Endpoints

Base path: `/api/auth`

### `POST /api/auth/login`
Authenticates user credentials and establishes an authenticated session.
- **Authorization:** Public (unauthenticated)
- **Request Body:**
  ```json
  {
    "email": "student@college.edu",
    "password": "Password123!"
  }
  ```
- **Responses:**
  - `200 OK`: User authenticated. Returns user profile; issues JWT access token and sets/returns refresh token mechanism.
    ```json
    {
      "user": {
        "id": "c1f7b8a0-1234-4b56-8a9b-123456789abc",
        "name": "Alex Smith",
        "email": "student@college.edu",
        "college": "State Technical University",
        "role": "STUDENT",
        "createdAt": "2026-09-09T10:00:00Z"
      }
    }
    ```
  - `400 Bad Request`: Malformed request or validation failure.
  - `401 Unauthorized`: Invalid email or password.

### `POST /api/auth/refresh`
Rotates the refresh token and issues a fresh JWT access token.
- **Authorization:** Public / Authenticated with refresh token context
- **Responses:**
  - `200 OK`: Token rotated successfully; fresh access token provided.
  - `401 Unauthorized`: Expired, revoked, reused, or invalid refresh token.

### `POST /api/auth/logout`
Terminates the current authenticated session and revokes the associated refresh token.
- **Authorization:** Authenticated
- **Responses:**
  - `204 No Content`: Successfully logged out.
  - `401 Unauthorized`: Missing or invalid authentication.

### `GET /api/auth/me`
Retrieves the profile of the currently authenticated user.
- **Authorization:** Authenticated (`STUDENT`, `ORGANIZER`, or `ADMIN`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "user": {
        "id": "c1f7b8a0-1234-4b56-8a9b-123456789abc",
        "name": "Alex Smith",
        "email": "student@college.edu",
        "college": "State Technical University",
        "role": "STUDENT",
        "createdAt": "2026-09-09T10:00:00Z"
      }
    }
    ```
  - `401 Unauthorized`: Unauthenticated request.

---

## 4. User Endpoints

Base path: `/api/users`

- **Current MVP Scope:** User identity and profile retrieval are handled via `GET /api/auth/me`.
- **System User Administration:** Any broader administrative user management endpoints (such as `GET /api/users` or `PUT /api/users/:id`) are **TBD / Not in MVP Scope** pending confirmed administrator requirements.

---

## 5. Event Endpoints

Base path: `/api/events`

### Event Lifecycle States
```
DRAFT ───► PUBLISHED ───► COMPLETED
               │
               └───► CANCELLED
```
*Note: `FULL` and `REGISTRATION CLOSED` are derived registration availability states, not event lifecycle states.*

### `GET /api/events`
List events discoverable by the requester.
- **Authorization:** Public / Authenticated
  - For `STUDENT` or unauthenticated clients: Returns only `PUBLISHED` events that are not cancelled.
  - For `ORGANIZER`: Returns published events plus events owned by the organizer.
  - For `ADMIN`: System-wide event visibility.
- **Query Parameters:**
  - `search` *(optional)*: Text search matching title or description.
  - `category` *(optional)*: Category filter.
  - `status` *(optional)*: Status filter (allowed only for organizer/admin).
  - `from` / `to` *(optional)*: Date range filter on `startTime`.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "events": [
        {
          "id": "e2a1c0d4-5678-4ef0-9a12-abcdef123456",
          "organizerId": "u1b2c3d4-5678-4ef0-9a12-abcdef654321",
          "title": "Annual Hackathon 2026",
          "description": "24-hour campus hackathon.",
          "category": "Hackathon",
          "startTime": "2026-10-15T09:00:00Z",
          "endTime": "2026-10-16T09:00:00Z",
          "venue": "Innovation Hub, Room 101",
          "capacity": 100,
          "registrationDeadline": "2026-10-10T23:59:59Z",
          "eligibility": "Open to all enrolled undergraduate students",
          "prize": "$1,000 in prizes",
          "status": "PUBLISHED",
          "createdAt": "2026-09-09T10:00:00Z",
          "updatedAt": "2026-09-09T10:00:00Z"
        }
      ]
    }
    ```

### `GET /api/events/:id`
Fetch details for a single event.
- **Authorization:** Public / Authenticated
- **Rules:** Draft or private events return `404 Not Found` for ordinary student requesters.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "event": {
        "id": "e2a1c0d4-5678-4ef0-9a12-abcdef123456",
        "organizerId": "u1b2c3d4-5678-4ef0-9a12-abcdef654321",
        "title": "Annual Hackathon 2026",
        "description": "24-hour campus hackathon.",
        "category": "Hackathon",
        "startTime": "2026-10-15T09:00:00Z",
        "endTime": "2026-10-16T09:00:00Z",
        "venue": "Innovation Hub, Room 101",
        "capacity": 100,
        "registrationDeadline": "2026-10-10T23:59:59Z",
        "eligibility": "Open to all enrolled undergraduate students",
        "prize": "$1,000 in prizes",
        "status": "PUBLISHED",
        "createdAt": "2026-09-09T10:00:00Z",
        "updatedAt": "2026-09-09T10:00:00Z"
      }
    }
    ```
  - `404 Not Found`: Event does not exist or requester lacks visibility.

### `POST /api/events`
Create a new event in `DRAFT` status.
- **Authorization:** `ORGANIZER` or `ADMIN`
- **Rules:** The backend binds `organizerId` to the authenticated user's ID. Client cannot specify an arbitrary organizer ID.
- **Request Body:**
  ```json
  {
    "title": "Web Dev Workshop",
    "description": "Hands-on TypeScript and Express workshop",
    "category": "Workshop",
    "startTime": "2026-10-20T14:00:00Z",
    "endTime": "2026-10-20T17:00:00Z",
    "venue": "Lab 3",
    "capacity": 40,
    "registrationDeadline": "2026-10-19T23:59:59Z",
    "eligibility": "Open to all colleges",
    "prize": null
  }
  ```
- **Responses:**
  - `201 Created`: Created event record with `status: "DRAFT"`.
  - `400 Bad Request`: Validation failure (e.g. `startTime >= endTime`, `registrationDeadline >= startTime`, `capacity <= 0`).
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Requester is not an `ORGANIZER` or `ADMIN`.

### `PUT /api/events/:id`
Update an existing event.
- **Authorization:** `ORGANIZER` owner or `ADMIN`
- **Rules:** An organizer can only update events they created.
- **Responses:**
  - `200 OK`: Updated event record.
  - `403 Forbidden`: Non-owning organizer attempting mutation.
  - `404 Not Found`: Event does not exist.

### `POST /api/events/:id/publish`
Publish a draft event, making it discoverable and eligible for registrations.
- **Authorization:** `ORGANIZER` owner or `ADMIN`
- **Rules:** Validates required fields, ensures event is currently in `DRAFT` status.
- **Responses:**
  - `200 OK`: Event with `status: "PUBLISHED"`.
  - `403 Forbidden`: Non-owner organizer.
  - `404 Not Found`: Event not found.
  - `409 Conflict`: Event is already published or cancelled.

### `POST /api/events/:id/cancel`
Cancel an event.
- **Authorization:** `ORGANIZER` owner or `ADMIN`
- **Rules:** Transitions event to `CANCELLED`. Cancelled events reject subsequent registration attempts.
- **Responses:**
  - `200 OK`: Event with `status: "CANCELLED"`.
  - `403 Forbidden`: Non-owner organizer.
  - `404 Not Found`: Event not found.

---

## 6. Registration Endpoints

Base path: `/api`

### Registration Business Rules
- Registration model: **Individual student registration**.
- Multiple events: A student may register for multiple different events.
- Active uniqueness: A student may have at most **one ACTIVE registration** per event.
- Schedule overlap: Overlapping event dates do not automatically block registration.
- Cross-college: Participants may belong to different institutions unless the event restricts eligibility.
- Concurrency: Capacity checks are safe against concurrent registration requests.

### `POST /api/events/:id/register`
Register the authenticated student for an event.
- **Authorization:** `STUDENT`
- **Request Body:** None required (identity derived from JWT, event ID from route param `:id`).
- **Validation Pipeline:**
  1. Authenticate user as `STUDENT`.
  2. Verify target event exists, has `status: "PUBLISHED"`, and is not cancelled.
  3. Verify current time is before `event.registrationDeadline`.
  4. Verify student meets event eligibility rules.
  5. Check if user already holds an `ACTIVE` registration for this event (reject with `409 Conflict`).
  6. Verify event capacity has not been exceeded under concurrency.
  7. Insert registration record with `status: "ACTIVE"`.
- **Responses:**
  - `201 Created`:
    ```json
    {
      "registration": {
        "id": "r1a2b3c4-9876-4ef0-9a12-abcdef123456",
        "userId": "c1f7b8a0-1234-4b56-8a9b-123456789abc",
        "eventId": "e2a1c0d4-5678-4ef0-9a12-abcdef123456",
        "status": "ACTIVE",
        "registeredAt": "2026-09-09T10:00:00Z"
      }
    }
    ```
  - `400 Bad Request`: Registration deadline has passed (`REGISTRATION_DEADLINE_PASSED`) or ineligible (`REGISTRATION_NOT_ELIGIBLE`).
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Requester is not a `STUDENT`.
  - `404 Not Found`: Event does not exist or is not published.
  - `409 Conflict`: Duplicate active registration (`REGISTRATION_DUPLICATE`) or event is full (`REGISTRATION_CAPACITY_EXCEEDED`).

### `POST /api/registrations/:id/cancel`
Cancel / withdraw the authenticated student's active registration.
- **Authorization:** `STUDENT` owner
- **Rules:** The student may only cancel their own active registration. The record is retained with `status: "CANCELLED"` for historical tracking.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "registration": {
        "id": "r1a2b3c4-9876-4ef0-9a12-abcdef123456",
        "userId": "c1f7b8a0-1234-4b56-8a9b-123456789abc",
        "eventId": "e2a1c0d4-5678-4ef0-9a12-abcdef123456",
        "status": "CANCELLED",
        "registeredAt": "2026-09-09T10:00:00Z"
      }
    }
    ```
  - `404 Not Found`: Registration does not exist or belongs to another user.
  - `409 Conflict`: Registration is already cancelled (`REGISTRATION_ALREADY_CANCELLED`).

### `GET /api/registrations/me`
Retrieve all event registrations for the authenticated student.
- **Authorization:** `STUDENT`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "registrations": [
        {
          "id": "r1a2b3c4-9876-4ef0-9a12-abcdef123456",
          "eventId": "e2a1c0d4-5678-4ef0-9a12-abcdef123456",
          "registeredAt": "2026-09-09T10:00:00Z",
          "status": "ACTIVE",
          "event": {
            "id": "e2a1c0d4-5678-4ef0-9a12-abcdef123456",
            "title": "Annual Hackathon 2026",
            "startTime": "2026-10-15T09:00:00Z",
            "endTime": "2026-10-16T09:00:00Z",
            "venue": "Innovation Hub, Room 101"
          }
        }
      ]
    }
    ```
  - `401 Unauthorized`: Unauthenticated.

---

## 7. Participant Management Endpoints

Base path: `/api/events`

### `GET /api/events/:id/participants`
Retrieve participant registration records for an event.
- **Authorization:** `ORGANIZER` owner or `ADMIN`
- **Rules:** Organizers can only inspect participant rosters for events they own.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "eventId": "e2a1c0d4-5678-4ef0-9a12-abcdef123456",
      "registrations": [
        {
          "id": "r1a2b3c4-9876-4ef0-9a12-abcdef123456",
          "registeredAt": "2026-09-09T10:00:00Z",
          "status": "ACTIVE",
          "student": {
            "id": "c1f7b8a0-1234-4b56-8a9b-123456789abc",
            "name": "Alex Smith",
            "email": "student@college.edu",
            "college": "State Technical University"
          }
        }
      ]
    }
    ```
  - `403 Forbidden`: Non-owner organizer.
  - `404 Not Found`: Event not found.

---

## 8. Authorization Matrix Summary

| Endpoint | Student | Organizer | Admin |
| :--- | :---: | :---: | :---: |
| `POST /api/auth/login` | Public | Public | Public |
| `POST /api/auth/refresh` | Public | Public | Public |
| `POST /api/auth/logout` | Own session | Own session | Own session |
| `GET /api/auth/me` | Own profile | Own profile | Own profile |
| `GET /api/events` | Published only | Published + Own | All |
| `GET /api/events/:id` | Published only | Published + Own | All |
| `POST /api/events` | ❌ | Allowed | Allowed |
| `PUT /api/events/:id` | ❌ | Own event only | Any authorized event |
| `POST /api/events/:id/publish` | ❌ | Own event only | Any authorized event |
| `POST /api/events/:id/cancel` | ❌ | Own event only | Any authorized event |
| `POST /api/events/:id/register` | Allowed | ❌ | ❌ |
| `POST /api/registrations/:id/cancel` | Own registration only | ❌ | ❌ |
| `GET /api/registrations/me` | Own registrations | ❌ | ❌ |
| `GET /api/events/:id/participants` | ❌ | Own event only | Any authorized event |

---

## 9. Unresolved Requirements & Out-of-Scope Items (TBD)

The following areas are intentionally unresolved or outside confirmed MVP scope:
- **Event Categories Taxonomy:** Categories are stored as strings; no rigid closed taxonomy is currently enforced.
- **Team / Group Participation:** Team creation, captaincy, and team registration are **TBD** and not part of the MVP individual registration model.
- **Structured Eligibility Engine:** Eligibility is currently evaluated via text / basic college rules; complex rule evaluation engines are **TBD**.
- **Excluded Features:** The MVP explicitly does **not** include:
  - Payments / UPI integration
  - QR attendance tracking
  - Digital certificates
  - Recommendation engine
  - Waitlists / automated waitlist promotion
  - In-app notification broadcasting
  - Social media publishing
