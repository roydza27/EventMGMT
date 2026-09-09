# Authentication API Tests (`apps/api/tests/auth/`)

## Scope & Purpose
This directory contains API contract and integration test specifications for the authentication module (`/api/auth`).

---

## Planned Test Cases

### 1. `POST /api/auth/login`
- **Happy Path:** Valid credentials return `200 OK` with public user profile (`id`, `name`, `email`, `college`, `role`) and appropriate access/refresh tokens.
- **Invalid Credentials:** Incorrect password or non-existent email returns `401 Unauthorized` (`INVALID_CREDENTIALS`).
- **Validation Failure:** Malformed email or empty password returns `400 Bad Request` with structured `VALIDATION_ERROR` details.
- **Sensitive Data Leakage:** Ensure password hash and refresh token secrets are never returned in response bodies.

### 2. `POST /api/auth/refresh`
- **Happy Path:** Valid refresh token issues a new JWT access token and rotates the refresh token.
- **Revoked / Expired Token:** Expired or already rotated refresh token returns `401 Unauthorized`.
- **Token Reuse Detection:** Attempting to reuse an invalidated refresh token rejects the request.

### 3. `POST /api/auth/logout`
- **Happy Path:** Authenticated request invalidates the refresh session and returns `204 No Content`.
- **Unauthenticated:** Request without valid token returns `401 Unauthorized`.

### 4. `GET /api/auth/me`
- **Happy Path:** Valid Bearer token returns current user profile with `200 OK`.
- **Missing Token:** Request without authorization header returns `401 Unauthorized` (`NO_TOKEN_PROVIDED`).
- **Tampered Token:** Forged or expired signature returns `401 Unauthorized` (`INVALID_TOKEN`).

---

## Prerequisites
- Requires completion of Task 2 (shared user & auth contracts) and Task 3 (Express middleware, JWT & password services).
