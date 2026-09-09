# College Event Management System

A centralized platform for college event discovery, management, and participation across institutions.

---

## Architecture Overview

The system is built as a TypeScript modular monolith organized across pnpm workspaces:

- **Frontend:** Next.js application in [`apps/web/`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/apps/web)
- **Backend API:** Express REST API in [`apps/api/`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/apps/api)
- **Shared Contracts:** Domain types, enums, and API contracts in [`packages/shared/`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/packages/shared)
- **Database:** PostgreSQL managed via Prisma in [`prisma/`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/prisma)

---

## Documentation Quick Links

- **API Reference & Contracts:** [`docs/api.md`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/docs/api.md)
- **Development & Testing Guide:** [`docs/development.md`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/docs/development.md)
- **Operating Protocols:** [`AGENTS.md`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/AGENTS.md)
- **Project State & Memory:** [`MEMORY.md`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/MEMORY.md)

---

## API & Backend Locations

- **API Entrypoint:** `apps/api/src/server.ts`
- **Application Factory & Middleware:** `apps/api/src/app.ts`
- **Domain Modules:** `apps/api/src/modules/` (`auth`, `events`, `registrations`, `participants`, `users`)
- **Backend Tests:** `apps/api/tests/` (Infrastructure, Auth, Events, Registrations, Participants)
- **End-to-End Tests:** `tests/e2e/`

---

## Running Tests

```bash
# Run backend infrastructure tests
pnpm --filter @eventmgmt/api test

# Run database integrity tests
pnpm test:db
```

See [`docs/development.md`](file:///home/cy3pher/Documents/WorkSpace-Dev/EventMGMT/docs/development.md) for full testing workflows and layer distinctions.
