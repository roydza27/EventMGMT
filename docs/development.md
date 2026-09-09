# Development & Testing Guide

This guide describes how to develop, test, and contribute to the College Event Management System.

---

## 1. Project Organization

```
├── apps/
│   ├── api/                    # Express backend service
│   │   ├── src/                # Application source code
│   │   └── tests/              # Backend test suites
│   └── web/                    # Next.js frontend application
├── packages/
│   └── shared/                 # Shared TypeScript types, enums, and API contracts
├── prisma/                     # Database schema, migrations, and seed scripts
├── tests/
│   ├── db-integrity.test.ts    # Database schema and constraint integration tests
│   └── e2e/                    # End-to-end multi-step workflow tests
└── docs/                       # Project specifications and architecture docs
```

---

## 2. Where the API & Tests Live

- **API Routes & Handlers:** Located in `apps/api/src/modules/<domain>/`
- **API Contracts Documentation:** [`docs/api.md`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/docs/api.md)
- **Backend Tests:** Located in `apps/api/tests/`
  - `apps/api/tests/infrastructure.test.ts`: Express foundation, middleware, token, and error handling tests.
  - `apps/api/tests/auth/`: Authentication endpoint tests.
  - `apps/api/tests/events/`: Event CRUD and lifecycle transition tests.
  - `apps/api/tests/registrations/`: Event registration, duplicate prevention, and cancellation tests.
  - `apps/api/tests/participants/`: Organizer participant roster tests.
- **End-to-End Tests:** Located in `tests/e2e/`.

---

## 3. Test Layers & Execution

| Test Layer | Location | Purpose | Execution Command |
| :--- | :--- | :--- | :--- |
| **Backend Infrastructure** | `apps/api/tests/infrastructure.test.ts` | Validates middleware, error handling, JWT signing, password hashing, and role guards | `pnpm --filter @eventmgmt/api test` |
| **Database Integrity** | `tests/db-integrity.test.ts` | Validates PostgreSQL constraints, temporal rules, foreign keys, and unique indexes | `npx tsx tests/db-integrity.test.ts` |
| **Shared Contracts Build** | `packages/shared/` | Validates compilation and type safety of shared domain contracts | `pnpm --filter @eventmgmt/shared build` |
| **Domain API Tests** | `apps/api/tests/<domain>/` | Validates REST endpoints, authorization boundaries, and business rules | Executed via domain test runners once module endpoints are wired |
| **End-to-End Tests** | `tests/e2e/` | Validates full student, organizer, and admin workflows | Executed against configured test database |

---

## 4. Dependencies & Prerequisites for API Integration Tests

Before running domain API integration tests (`apps/api/tests/<domain>/`):
1. **PostgreSQL Database:** Database running and migrated (`pnpm db:migrate` or `prisma migrate deploy`).
2. **Environment Configuration:** Valid `.env` configuration satisfying `apps/api/src/config/env.ts` (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
3. **Shared Contracts Compiled:** `pnpm --filter @eventmgmt/shared build`.
4. **Seed Data (Optional for manual testing):** `pnpm db:seed`.

---

## 5. Development Workflow Guidelines

1. **Incremental Tasks:** Implement only one defined task at a time following [`AGENTS.md`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/AGENTS.md).
2. **Server-Side Validation:** Never trust client-supplied user IDs or roles. Always extract user identity from authenticated JWT context.
3. **Strict Type Safety:** Use explicit interfaces from `@eventmgmt/shared` rather than untyped payloads or implicit `any`.
4. **No Premature Scope Expansion:** Do not implement features marked out-of-scope or TBD in [`docs/api.md`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/docs/api.md).
