# Backend Test Suite Organization

This directory (`apps/api/tests/`) houses unit, integration, and API contract test suites for the College Event Management System backend.

---

## 1. Directory Structure

```
apps/api/tests/
├── infrastructure.test.ts      # Core API middleware, JWT, hashing, and error tests
├── auth/                       # Authentication and session API tests
│   └── README.md
├── events/                     # Event management & discovery API tests
│   └── README.md
├── registrations/              # Individual registration & cancellation API tests
│   └── README.md
├── participants/               # Organizer participant roster API tests
│   └── README.md
└── README.md                   # This document
```

---

## 2. Test Layer Classifications

1. **Unit Tests (`*.unit.test.ts` or scoped test files):**
   - Test isolated business logic, Zod validation schemas (`*.schema.ts`), utility helpers (password hashing, JWT verification), and standalone functions.
   - Do not require database or running network services.
   - Fast and fully deterministic.

2. **Integration / API Contract Tests (`*.integration.test.ts` or domain test runners):**
   - Located in the respective domain module directory (`auth/`, `events/`, `registrations/`, `participants/`).
   - Use `supertest` to dispatch HTTP requests against the configured Express application (`createApp()`).
   - Validate HTTP status codes, JSON response envelope, error structures, header expectations, and database mutations.

3. **End-to-End Tests:**
   - Located in the root monorepo directory (`tests/e2e/`).
   - Exercise full cross-module workflows across multiple endpoints (e.g. Student login -> Event search -> Register -> View My Registrations -> Cancel).

---

## 3. Naming & Execution Conventions

- **File Naming:**
  - Feature test files should end with `.test.ts` (e.g. `auth.test.ts`, `events-lifecycle.test.ts`).
  - Unit-focused files: `*.unit.test.ts`.
  - Integration-focused files: `*.integration.test.ts`.
- **Test Runner:**
  - Tests are run via `tsx` (TypeScript execute) without an extra build step.
  - Run the API test suite from workspace root:
    ```bash
    pnpm --filter @eventmgmt/api test
    ```

---

## 4. Test Isolation Rules

1. **Independent Test State:** Tests must not depend on side-effects from preceding tests.
2. **Transaction / Fixture Isolation:** Where persistent database records are created during integration tests, clean up or roll back test data to prevent state leakage.
3. **No Arbitrary Sleep Calls:** Prefer deterministic assertions and async waiting on promises rather than time-based pauses.
4. **Strict Error Verification:** Verify both successful HTTP 2xx paths and negative paths (400, 401, 403, 404, 409) ensuring standard error payloads match `docs/api.md`.

---

## 5. Implementation Prerequisites for Domain Tests

The domain integration suites in subdirectories (`auth/`, `events/`, `registrations/`, `participants/`) are designed to run once the following dependencies are fully wired:
- **Task 1:** Prisma database foundation, client generation, and test database migrations.
- **Task 2:** Shared domain contracts in `@eventmgmt/shared`.
- **Task 3:** API infrastructure (environment validation, error handler, authentication middleware).
