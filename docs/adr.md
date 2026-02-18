# Architecture Decision Record (ADR) — Home Meal Planning System

This document captures the architecture decisions that must remain consistent throughout the project.
Any change to these decisions must be documented here as a new ADR entry.

---

## ADR-001 — Clean Architecture as baseline
**Status:** Accepted  
**Date:** 2026-02-18

### Decision
Use Clean Architecture with a DDD-light approach:

- Domain: pure business rules, no frameworks
- Application: use-cases + ports (interfaces)
- Infrastructure: Prisma repositories, external adapters
- Interfaces: HTTP handlers + mappers + runtime validation

### Rationale
- Testability (TDD-first)
- Long-term maintainability and extension (admin/mobile)
- Clear boundaries between business and infrastructure

### Consequences
- Domain must not import Prisma/Fastify/etc.
- All external IO happens behind ports
- HTTP layer only maps contracts ↔ use-cases

---

## ADR-002 — Monorepo with shared contracts package
**Status:** Accepted  
**Date:** 2026-02-18

### Decision
Use a monorepo structure:

- `apps/api` — backend API
- `apps/web` — web demo
- `apps/admin` — admin panel (future)
- `apps/mobile` — mobile app (future)
- `packages/contracts` — shared DTOs + Zod schemas

### Rationale
- Keep contracts consistent across API/web/mobile
- Reduce drift and duplication
- Improve demo speed and integration

### Consequences
- No domain entities inside `contracts`
- HTTP request/response shapes must be validated with `contracts`

---

## ADR-003 — TypeScript across backend and web
**Status:** Accepted  
**Date:** 2026-02-18

### Decision
Use TypeScript for:
- API implementation (Node.js)
- Web demo (React + Vite)
- Shared contracts (Zod)

### Rationale
- Shared types/contracts
- Faster iteration for TFM timeline
- Strong typing + maintainable codebase

---

## ADR-004 — Persistence with PostgreSQL + Prisma
**Status:** Accepted  
**Date:** 2026-02-18

### Decision
Use PostgreSQL as the primary database and Prisma as ORM.

### Rationale
- Strong relational model for households/recipes/inventory/suggestions
- Prisma DX and migrations
- Works well for deployment

### Consequences
- Prisma models may not map 1:1 to domain entities (by design)
- Repositories must map Prisma models → domain entities

---

## ADR-005 — API style: REST + Zod runtime validation
**Status:** Accepted  
**Date:** 2026-02-18

### Decision
Use REST endpoints for the API and validate all requests/responses with Zod contracts.

### Rationale
- Simple to demo and test
- Easy to consume from web/mobile
- Prevents silent breaking changes

### Consequences
- Every endpoint must `safeParse` request and response
- Responses must be primitives (UUID strings, ISO dates, numbers)

---

## ADR-006 — TDD mandatory development process
**Status:** Accepted  
**Date:** 2026-02-18

### Decision
Adopt strict TDD:
Red → Green → Refactor

### Rationale
- Higher confidence during rapid iteration
- Clean Architecture benefits from test coverage
- Reduced regression risk

### Consequences
- New behavior requires failing test first
- Bugs must be reproduced by failing test before fix

---

## ADR-007 — Security baseline (Auth + OWASP Top 10)
**Status:** Accepted  
**Date:** 2026-02-18

### Decision
Add authentication + authorization as a required baseline and follow OWASP Top 10 practices.

### Rationale
- Household data must not be accessible without auth
- TFM requires responsible engineering practices

### Consequences
- Introduce user/session model
- Enforce household membership checks on protected routes
- Security headers + input validation + rate limiting (MVP)

---

## ADR-008 — UI stack: Tailwind CSS for web (and later admin)
**Status:** Accepted  
**Date:** 2026-02-18

### Decision
Use Tailwind CSS in `apps/web` (and later `apps/admin`) to build a responsive demo.

### Rationale
- Fast iteration
- Consistent UI
- Presentable demo for evaluation

### Consequences
- Shared UI components can be added later as `packages/ui` if needed

---

## ADR-009 — Cooking Plan as primary entry point

**Status:** Accepted  
**Date:** 2026-02-19

### Decision
Expose a single orchestration endpoint `/plan/today` that encapsulates:
- Suggestion generation
- Shopping fallback
- Business decision logic

### Rationale
- Simplifies frontend integration
- Centralizes cooking decision logic
- Prevents fragmented client orchestration

### Consequences
- Frontend does not manually chain suggestion + shopping logic
- Business logic remains inside application layer
