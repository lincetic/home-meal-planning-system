# AGENTS.md — Project Development Rules (Home Meal Planning System)

This file defines non-negotiable rules for development. Any automated agent (Codex) and the project maintainer must follow them.

## 1) Core Principle: TDD is mandatory (Red → Green → Refactor)

For any change that affects business behavior:

1. Write tests FIRST
2. Run tests → MUST FAIL (Red)
3. Implement the MINIMUM code to make them pass
4. Run tests → MUST PASS (Green)
5. Refactor (optional) while keeping tests green

### Notes
- Do NOT write implementation code before the failing test exists.
- Prefer small steps: one behavior per test.
- If fixing a bug: reproduce it with a failing test first.

## 2) Architecture Rules (Clean Architecture)

- Domain layer has NO dependency on frameworks or infrastructure.
- Application layer orchestrates domain (use cases).
- Infrastructure implements ports (repositories, external services).
- Interface/HTTP layer maps contracts ↔ use cases.

Dependency direction: UI/Infra → Application → Domain.

### Folder conventions (backend)
- `src/domain/*` entities/value-objects/services
- `src/application/*` use-cases + ports
- `src/infrastructure/*` prisma, repositories, adapters
- `src/interfaces/*` http controllers/handlers + mappers

## 3) Contracts & Validation (Zod)

- All HTTP endpoints must validate request/response using `@tfm/contracts` (Zod).
- No endpoint should return raw domain entities or Prisma models.
- Always map primitives:
  - Dates → ISO `YYYY-MM-DD` strings
  - Quantity → number
  - IDs → UUID strings

## 4) Testing Strategy

### Backend
- Unit tests (domain/value objects) with Vitest
- Use-case tests with mocked repositories (ports)
- Integration tests for Prisma repositories (optional but recommended)

### Frontend
- Basic component tests later (optional in MVP)
- E2E tests (optional)

## 5) Git Workflow

- `main` branch only for stable increments.
- Work on feature branches: `feat/<topic>`, `fix/<topic>`.
- Every commit must:
  - pass tests
  - keep formatting/lint clean
  - include updated docs if API changes

## 6) Definition of Done (DoD)

A feature is "done" only if:
- Tests exist and pass
- API contracts updated (if needed)
- `docs/http-examples.md` updated (if API changes)
- No secrets committed
- Minimal UX is understandable (for demo flows)

## 7) Coding Standards

- TypeScript strict mode stays enabled.
- Prefer pure functions in domain.
- Avoid any “quick hacks” leaking into domain.
- Keep functions short; name intent clearly.

## 8) Demo Requirements (TFM)

The project must be deployable and usable by a teacher:
- A working web demo accessible via URL
- API reachable and documented
- A reproducible data seed and demo flow
- Optional: a short demo video

## 9) How to Ask Codex for Work

When requesting changes, include:
- the goal (user-visible behavior)
- the acceptance criteria (what must be true)
- any constraints (TDD, security, scope)

Example:
> "Add endpoint X. Write failing tests first. Make response match contract Y. Update http-examples."
