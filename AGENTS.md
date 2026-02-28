# AGENTS.md — Project Development Rules (Home Meal Planning System)

This file defines non-negotiable rules for development. Any automated agent (Codex) and the project maintainer must follow them.

---

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
- Do NOT modify existing tests unless behavior intentionally changes and documentation is updated.

---

## 2) Architecture Rules (Clean Architecture)

The project follows Clean Architecture.

- Domain layer has NO dependency on frameworks or infrastructure.
- Application layer orchestrates domain via use cases.
- Infrastructure implements ports (repositories, adapters).
- Interface/HTTP layer maps contracts ↔ use cases.

Dependency direction must always be:

UI / Infrastructure → Application → Domain

### Folder conventions (backend)

- `src/domain/*`  
  Entities, value objects, domain logic.

- `src/application/*`  
  Use cases + ports (repository interfaces).

- `src/infrastructure/*`  
  Prisma, repositories, adapters, external services.

- `src/interfaces/*`  
  HTTP controllers/handlers + mappers + middleware.

No layer may violate these boundaries.

---

## 3) Contracts & Validation (Zod)

- All HTTP endpoints must validate request and response using `@tfm/contracts` (Zod).
- No endpoint should return raw domain entities or Prisma models.
- Always map to primitives:
  - Dates → ISO `YYYY-MM-DD`
  - Quantity → number
  - IDs → UUID string
- If a contract changes:
  - Update contracts package
  - Update tests
  - Update http-examples.md
  - Update README if demo flow changes

Contracts are the single source of truth for the API.

---

## 4) Testing Strategy

### Backend

Must include:

- Domain tests (entities + value objects)
- Use-case tests with mocked repositories
- Authorization tests:
  - unauthenticated → 401
  - authenticated but wrong household → 403
  - authenticated + correct household → 200
- Idempotency tests when applicable (e.g., AcceptSuggestion)

Tests must run with:

```bash
pnpm test
```

No feature is complete if tests are failing.

### Frontend (MVP)

- Basic functional validation only.
- Focus is backend correctness and architecture.


---

## 5) Git Workflow

- `main` branch only for stable increments.
- Work on feature branches: `feat/<topic>`, `fix/<topic>`.
- Every commit must:
  - pass tests
  - keep formatting/lint clean
  - include updated docs if API changes

- `main` branch only for stable increments.
- Use feature branches:
  - `feat/<topic>`
  - `fix/<topic>`
  - `refactor/<topic>`
- Every commit must:
  - Pass all tests
  - Not introduce architectural violations
  - Keep documentation aligned
  - Avoid committing secrets or .env files
- Commit messages should describe behavior, not implementation details.

---

## 6) Definition of Done (DoD)

A feature is "done" only if:
- Tests exist and pass
- Contracts are updated (if applicable)
- http-examples.md updated (if API behavior changed)
- Documentation consistent with implementation
- No security rules violated
- Demo flow still works end-to-end

---

## 7) Coding Standards

- TypeScript strict mode remains enabled.
- No any in domain layer.
- Keep functions small and intention-revealing.
- Prefer explicit over implicit logic.
- No business logic inside controllers.
- No Prisma usage outside infrastructure layer.

---

## 8) Security MVP Rules (TFM Minimum)

Authentication and authorization are mandatory.

### Authentication

- Users authenticate via email + password.
- Passwords must be hashed (Argon2).
- Login returns a JWT access token.

### Authorization

Every household-scoped endpoint MUST:
  1. Require a valid JWT.
  2. Extract userId from token.
  3. Validate membership against householdId.
  4. Return:
    - 401 if no/invalid token
    - 403 if not member of household
    - 200 if authorized

Rules:
  - Never trust householdId from client without membership verification.
  - Do not leak stack traces in production mode.
  - Do not log sensitive information (passwords, tokens).

---

## 9) Demo Requirements (TFM)

The project must be understandable and runnable by a teacher.

Minimum demo capabilities:

- Login with seeded user
- Add inventory
- Generate suggestion
- Accept suggestion
- Call /plan/today again and see accepted state
- Authorization enforced (401 / 403 cases)

The system must be:

- Seedable from scratch
- Testable locally
- Architecturally explainable

---

## 10) How to Ask Codex for Work

When requesting changes, always include:

- The goal (user-visible behavior)
- Acceptance criteria
- Security implications
- TDD requirement
- Scope limits

Example:

"Add endpoint X. Write failing tests first. Must validate household membership. Update contracts and http-examples."

---

## 11) Demo & Release Checklist (TFM)

Before final submission:

- `pnpm test` passes
- Migrations reproducible from clean DB
- Seeds reproducible
- http-examples.md reflects secured API
- README includes:
  - Setup steps
  - Demo steps
  - Architecture overview
- Slide deck matches actual implementation
- Security rules demonstrable live

## 12) Non-Negotiable Principles

- Clean Architecture must not be compromised for speed.
- TDD must not be skipped.
- Security must not be bypassed for convenience.
- Documentation must reflect real behavior, not intended behavior.

If in doubt: write a failing test first.