# SECURITY.md — Security Requirements & Checklist

This project handles user accounts and household data. Security must be designed in from the start.

## 1) Minimum Security Goals

- Authentication required for any household data access.
- Authorization based on membership: users can only access their households.
- Secure password storage (Argon2).
- Basic OWASP Top 10 protections applied.
- No sensitive data in logs (passwords, tokens).

## 2) Auth & Session Strategy (MVP)

Current MVP implementation:

- Auth: email + password
- Password hashing: **Argon2**
- Session: **JWT access token** returned on login/register
- Access token is sent by clients via:
  - `Authorization: Bearer <token>`
- Refresh token rotation: not implemented yet (planned)

Operational notes:

- JWT secret is provided via environment variable (`JWT_SECRET`).
- JWT expiration is configurable (`JWT_EXPIRES_IN`, default 7d).

## 3) Authorization Rules

Household authorization is mandatory.

For every household-scoped endpoint the server must:

1. Require a valid JWT (401 if missing/invalid)
2. Extract `userId` from JWT (`sub`)
3. Validate membership via `HouseholdMember` for the provided `householdId`
4. Return:
  - 401 if unauthenticated
  - 403 if authenticated but not a member of the household
  - 200 if authorized

Rule:

- Never trust `householdId` from the client without membership verification (prevents IDOR).

## 4) OWASP Top 10 Checklist (Applied / MVP)

### A01 Broken Access Control
- Enforce household membership checks for every household endpoint.
- No IDOR: never trust householdId without verifying membership.

### A02 Cryptographic Failures
- Hash passwords with Argon2.
- Use HTTPS in production.
- Never log secrets, tokens, or passwords.

### A03 Injection
- Prisma parameterizes queries.
- Validate inputs strictly (Zod contracts).
- Avoid raw SQL composed from user input.

### A04 Insecure Design
- Threat model basic flows (login/register, household access, inventory ops).
- Secure defaults: deny by default when auth/authorization fails.

### A05 Security Misconfiguration
- Avoid leaking stack traces to clients (generic error messages in production).
- Limit CORS to known origins for non-local deployments.

### A06 Vulnerable Components
- Keep dependencies updated (pnpm audit).
- Avoid installing unnecessary packages.

### A07 Identification & Authentication Failures
- Rate limit login/register (planned / recommended for production).
- Refresh token handling (future work).

### A08 Software & Data Integrity Failures
- Lockfile committed.
- CI should run tests (recommended).
- Avoid running untrusted scripts.

### A09 Security Logging & Monitoring Failures
- Log auth events (login/register failures, forbidden access) without sensitive data.
- Record 401/403 events at least at info/warn level.

### A10 SSRF
- Future external fetches must validate URLs and block private IP ranges.

## 5) Security Middleware (Backend MVP)

Recommended/optional additions (depending on scope/time):
- `helmet` for security headers
- rate limiter (Fastify plugin)
- strict request validation (Zod already used)
- centralized error handler (no stack traces in prod)

## 6) Data Protection

- Principle of least privilege for DB credentials.
- Do not store plaintext secrets.
- Environment variables for config.

## 7) Secrets & Environment

- `.env` never committed
- Provide `.env.example` (recommended)
- Separate configs for dev/prod

## 8) Security Testing

Minimum automated tests:
- Unauthenticated access → 401
- Wrong household membership → 403
- Authorized access → 200

Optional tests:
- brute-force/rate limit behavior (if rate limiter is added)