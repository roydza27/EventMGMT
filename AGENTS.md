# AGENTS.md

# College Event Management System — Agent Protocol

This repository contains the College Event Management System.

The agent must treat this file as the repository-level operating protocol.

---

## 1. Core Principle

Work incrementally.

Do not attempt to build the entire application from the project specification in one pass.

Every implementation must correspond to a defined task.

The agent must:

1. Understand the current project state.
2. Identify the current task.
3. Load only the context required for that task.
4. Inspect the existing implementation.
5. Make the smallest correct change.
6. Validate the change.
7. Update project memory/state.
8. Continue only when dependencies are satisfied.

---

# 2. Source of Truth Hierarchy

When information conflicts, use this priority order:

1. Explicit user instructions in the current conversation
2. Confirmed project requirements
3. Module-specific project documentation
4. Implementation task specification
5. Existing implementation
6. MEMORY.md
7. Agent assumptions

Never override a confirmed requirement with an assumption.

If requirements are ambiguous, do not silently invent behavior.

Mark the issue as unresolved and ask for clarification when it blocks implementation.

---

# 3. Project Architecture

The application is a modular monolith.

## Frontend

Next.js + TypeScript

Location:

apps/web/

## Backend

Express + TypeScript

Location:

apps/api/

## Database

PostgreSQL

ORM:

Prisma

Location:

prisma/

## Shared Code

Shared types/constants:

packages/shared/

## Tests

Unit/integration tests:

apps/api/tests/

End-to-end tests:

tests/e2e/

---

# 4. Domain Modules

The current MVP consists of:

- Authentication & RBAC
- Users
- Event Management
- Event Discovery
- Registration
- Participant Management
- Student Dashboard
- Organizer Dashboard
- Admin Dashboard

Backend modules are organized by domain:

apps/api/src/modules/

Expected modules:

- auth
- users
- events
- registrations
- participants

Do not create unnecessary architectural layers.

Avoid introducing repositories, factories, adapters, ports, microservices, or other abstractions unless the project actually requires them.

---

# 5. MVP Roles

The system currently has exactly three roles:

- STUDENT
- ORGANIZER
- ADMIN

Do not introduce additional roles without an explicit requirement.

For example, do not introduce:

- VOLUNTEER
- MODERATOR
- JUDGE
- SUPER_ADMIN

unless explicitly requested.

---

# 6. Authentication

Authentication uses:

- JWT access tokens
- Refresh tokens
- Password hashing
- Authenticated backend middleware

Authentication is a security boundary.

Never rely on frontend route hiding as authorization.

The backend must verify:

1. Authentication
2. User role
3. Resource ownership where applicable

---

# 7. Authorization

Authorization must be enforced server-side.

## Organizer

An organizer may manage their own events.

They must not modify or manage another organizer's events.

## Admin

An admin may manage authorized system-wide resources.

## Student

Students may:

- Browse published events
- View event details
- Register for events
- View their registrations
- Cancel/withdraw their own active registrations

Students must not access organizer/admin operations.

---

# 8. Event Lifecycle

The canonical event lifecycle is:

DRAFT
  ↓
PUBLISHED
  ↓
COMPLETED

PUBLISHED
  ↓
CANCELLED

Do not treat these as lifecycle states:

- FULL
- REGISTRATION CLOSED

Those describe registration availability, not event lifecycle.

---

# 9. Registration Rules

The current MVP uses individual registration.

A student:

- May register for multiple different events.
- May have at most one ACTIVE registration for a given event.
- Has no global maximum number of event registrations.
- Is not automatically rejected because two registered events overlap.
- May cancel/withdraw an active registration.

Registration must enforce:

- Event exists
- Event is published
- Event is not cancelled
- Registration deadline has not passed
- Student is eligible
- Student does not already have an active registration
- Event capacity has not been exceeded

Capacity validation must be safe against concurrent registrations.

---

# 10. Registration Status

Current registration states:

ACTIVE
CANCELLED

Cancelled registrations may be retained for historical purposes.

The system must enforce:

At most one ACTIVE registration for the same:

(userId, eventId)

Prefer enforcing this at the PostgreSQL level with an appropriate partial unique index.

---

# 11. Cross-College Participation

Students may belong to different colleges/institutions.

Events may define eligibility restrictions.

Do not assume that all participants belong to the same college.

Do not hard-code a single-college restriction unless explicitly required.

---

# 12. Database Rules

PostgreSQL is the runtime source of truth.

Runtime application data must not be stored in JSON files.

JSON may be used for:

- Static configuration
- Seed data
- Development fixtures

Do not use GitHub files as a runtime database.

Database invariants should be enforced at the database level where practical.

Application business rules belong in backend services.

---

# 13. Event Data

Current event model includes:

- id
- organizerId
- title
- description
- category
- startTime
- endTime
- venue
- capacity
- registrationDeadline
- eligibility
- prize (optional)
- status
- createdAt
- updatedAt

Temporal rules:

startTime < endTime

registrationDeadline < startTime

Do not introduce a separate Venue entity unless explicitly required.

---

# 14. Current MVP Boundaries

Do NOT implement the following unless explicitly added to scope:

- AI chatbot
- WhatsApp integration
- Telegram integration
- Social media publishing
- Payments
- UPI integration
- QR attendance
- Certificates
- Recommendation engine
- Gamification
- Advanced analytics
- Complex notification systems
- Microservices
- Team/group participation
- Waitlists
- Automatic waitlist promotion
- Attendance tracking
- Event deletion workflow

If a feature appears useful but is outside the confirmed MVP, leave it out.

---

# 15. Team / Group Participation

Team participation is currently unresolved.

Do not create:

- Team
- TeamMember
- Captain
- Team registration

until team participation is explicitly confirmed.

If it is later confirmed, design it as an extension to the current individual registration model.

---

# 16. Event Categories

Exact event categories are currently unresolved.

Do not invent a large category taxonomy.

Use the currently documented representation until requirements are finalized.

---

# 17. Task Execution Protocol

The implementation task database is the execution queue.

Tasks are divided into phases:

P0 Foundation
P1 Database
P2 Authentication
P3 Event Management
P4 Event Discovery
P5 Registration
P6 Frontend
P7 Participant APIs
P8 Validation & Deployment

Task IDs such as:

P3.3

are execution identifiers.

---

## Before Starting a Task

The agent must:

1. Find the task.
2. Check its status.
3. Check dependencies.
4. Read the relevant project documentation.
5. Inspect existing code.
6. Confirm that the task is actually ready.

Do not start a blocked task.

---

## While Working

Change only what is necessary for the current task.

Do not refactor unrelated code.

Do not implement future tasks preemptively.

Do not silently expand scope.

If implementation reveals a requirement conflict:

STOP.

Record the conflict instead of guessing.

---

## After Working

The agent must:

1. Run relevant tests.
2. Run type checking.
3. Run linting when applicable.
4. Verify the acceptance criteria.
5. Inspect the resulting diff.
6. Update MEMORY.md.
7. Update the task status.

A task may only be marked `Done` after validation passes.

---

# 18. Context Loading Protocol

Do not load the entire project context into every task.

Use progressive context loading.

## Always load

- AGENTS.md
- MEMORY.md
- Current task

## Then load

Only the documentation relevant to the current task.

Examples:

Authentication task:

- Core Context
- Authentication & RBAC
- API Contracts

Event task:

- Core Context
- Event Management
- API Contracts

Registration task:

- Core Context
- Registration
- Data Model
- Security & Access Control
- API Contracts

Frontend task:

- Relevant feature documentation
- API Contracts
- Current frontend implementation

---

# 19. Notion MCP Context Protocol

Notion is the authoritative external project documentation source.

The local agent must use the Notion MCP server to retrieve project context when implementing tasks that depend on documented requirements, architecture, API contracts, security rules, database specifications, or other project decisions.

Do not rely on memory, previous chat output, or assumptions when the required project context exists in Notion.

---

## Notion Documentation Structure

The main project documentation is organized into these modules:

- 00 — Core Context
- 01 — Authentication & RBAC
- 02 — Event Management
- 03 — Event Discovery
- 04 — Registration
- 05 — Participant & Dashboard Management
- 06 — API Contracts
- 07 — Security & Access Control
- 08 — Data Model & Database Specification

The Notion `Implementation Tasks` database is the execution queue.

---

## When to Use Notion MCP

Use Notion MCP before implementation when:

- Starting a new task
- Working on a domain that has documented requirements
- An API contract needs to be checked
- A business rule is unclear
- Authorization behavior needs verification
- Database behavior needs verification
- A requirement may have changed
- Existing code conflicts with documented requirements
- The task references another module

Do not fetch the entire Notion workspace unnecessarily.

Load only the pages relevant to the current task.

---

## Task Context Loading

For every implementation task:

1. Read `AGENTS.md`.
2. Read `MEMORY.md`.
3. Identify the current Notion implementation task.
4. Retrieve the task from the Notion `Implementation Tasks` database.
5. Read the task's dependencies and acceptance criteria.
6. Identify which Notion module pages are relevant.
7. Retrieve those module pages using Notion MCP.
8. Inspect the existing source code.
9. Implement the task.
10. Validate the implementation.
11. Update local `MEMORY.md`.
12. Update the corresponding Notion task status.

---

## Context Mapping

Use the following mapping as the default.

### Authentication Tasks

Read:

- 00 — Core Context
- 01 — Authentication & RBAC
- 06 — API Contracts
- 07 — Security & Access Control

### Event Management Tasks

Read:

- 00 — Core Context
- 02 — Event Management
- 06 — API Contracts
- 07 — Security & Access Control
- 08 — Data Model & Database Specification

### Event Discovery Tasks

Read:

- 00 — Core Context
- 02 — Event Management
- 03 — Event Discovery
- 06 — API Contracts

### Registration Tasks

Read:

- 00 — Core Context
- 01 — Authentication & RBAC
- 04 — Registration
- 06 — API Contracts
- 07 — Security & Access Control
- 08 — Data Model & Database Specification

### Participant Tasks

Read:

- 00 — Core Context
- 01 — Authentication & RBAC
- 05 — Participant & Dashboard Management
- 06 — API Contracts
- 07 — Security & Access Control

### Frontend Tasks

Read:

- 00 — Core Context
- Relevant feature module
- 06 — API Contracts
- Existing frontend implementation

---

## Progressive Context Loading

Do not load all Notion pages for every task.

Use progressive loading:

Task
  ↓
Identify affected domain
  ↓
Load relevant Notion modules
  ↓
Inspect source code
  ↓
Implement
  ↓
Validate

Only retrieve additional Notion context when the current task requires it.

---

## Notion vs Local Memory

Use Notion for:

- Requirements
- Business rules
- Architecture decisions
- API contracts
- Database specifications
- Security requirements
- Acceptance criteria
- Implementation task state

Use `MEMORY.md` for:

- What has already been implemented
- Current development state
- Recent changes
- Known bugs
- Current blockers
- Validation results
- Short-lived implementation notes

Do not copy entire Notion pages into `MEMORY.md`.

---

## Conflict Handling

If Notion documentation conflicts with existing code:

1. Do not silently preserve the existing behavior.
2. Compare the requirement against the implementation task.
3. Determine whether the code is outdated or the requirement is unresolved.
4. If the requirement is confirmed, update the implementation.
5. If the requirement itself is ambiguous, stop and record the issue.
6. Do not invent a new requirement.

---

## Updating Notion

The agent should update the Notion `Implementation Tasks` database when:

- A task begins
- A task is completed
- A task becomes blocked
- Acceptance criteria change
- Important implementation information needs to be recorded

A task must not be marked `Done` until its acceptance criteria have been validated.

When updating a task, keep notes concise.

Record:

- What was implemented
- Important technical decision
- Validation performed
- Any remaining blocker

---

## Notion Is Not a Substitute for Source Code

Notion describes the intended system.

The repository contains the actual implementation.

Always inspect both.

Notion:
"What should exist?"

Source code:
"What currently exists?"

The agent must reconcile the two before making changes.

---

## MCP Failure

If Notion MCP is unavailable:

- Do not invent missing requirements.
- Use `MEMORY.md` only for information already recorded locally.
- Continue only if the task can be completed safely from available context.
- Otherwise mark the task as blocked and explain what Notion context is required.

Never fabricate Notion content.

---

## Context Efficiency Rule

The goal is not to maximize context.

The goal is to load the minimum context required to make the correct change.

Prefer:

specific task
→ relevant Notion pages
→ relevant source files
→ implementation

over:

entire Notion workspace
→ entire repository
→ implementation
---

# 20. Existing Code Is Evidence, Not Authority

Existing code may be incomplete or incorrect.

Do not blindly copy existing behavior.

Compare implementation against:

- confirmed requirements
- module documentation
- task acceptance criteria

Correct implementation when it conflicts with confirmed requirements.

---

# 21. Dependency Discipline

Before modifying a module, understand its dependencies.

Example:

Registration depends on:

Authentication
Database
Events
Eligibility
Capacity rules

Therefore registration should not be implemented before its required dependencies are available.

Do not bypass missing dependencies with fake implementations unless explicitly requested for testing.

---

# 22. Testing Philosophy

Prefer tests that verify behavior and business rules.

Important cases include:

- Authentication
- Authorization
- Organizer ownership
- Event lifecycle
- Duplicate registration
- Capacity limits
- Registration deadline
- Eligibility
- Registration cancellation
- Cross-college participation
- Unauthorized resource access

Do not only test successful paths.

---

# 23. Security Rules

Never:

- Trust client-provided roles
- Trust client-provided user IDs for ownership
- Skip backend authorization
- Store plaintext passwords
- Expose secrets
- Commit .env files
- Bypass validation for convenience
- Allow client-side capacity checks to be the only protection

Sensitive operations must be validated on the server.

---

# 24. Git Discipline

Keep commits focused.

Prefer:

feat(auth): implement login

over:

update everything

Do not commit:

- .env
- secrets
- credentials
- generated build artifacts
- node_modules

Review the diff before committing.

---

# 25. Agent Behavior

Be conservative with assumptions.

Be aggressive with validation.

Prefer:

small change → test → verify → record

over:

large change → hope → debug everything

When uncertain, preserve the existing architecture and ask rather than invent.

---

# 26. Definition of Done

A task is Done only when:

- Implementation exists
- Acceptance criteria are satisfied
- Relevant tests pass
- Type checking passes
- No known requirement conflict remains
- No unnecessary scope was introduced
- Project memory is updated
- Task status is updated

---

# 27. Final Rule

The agent is not here to redesign the project every time it encounters a problem.

The agent is here to execute the confirmed plan reliably.

Implement the current task.

Validate it.

Record what changed.

Then move to the next task.