# SECURITY.md — Security Requirements & Checklist

This project will handle user accounts and household data. Security must be designed in from the start.

## 1) Minimum Security Goals

- Authentication required for any household data access.
- Authorization based on membership: users can only access their households.
- Secure session management (token-based or cookie-based with CSRF mitigation).
- Basic OWASP Top 10 protections applied.

## 2) Auth & Session Strategy (MVP)

Recommended MVP approach:
- Auth: email + password (hashed) OR magic link (later)
- Sessions: JWT access token + refresh token (or secure cookies)
- Password hashing: Argon2 (preferred) or bcrypt
- Rate limiting on login endpoints
- Account lockout/backoff policy (basic)

## 3) Authorization Rules

- Every request must identify user (auth middleware).
- Every operation must check:
  - user is a member of the householdId in the request
  - role-based restrictions if needed (ADMIN vs MEMBER)

## 4) OWASP Top 10 Checklist (Applied)

### A01 Broken Access Control
- Enforce household membership checks for every endpoint.
- No IDOR: never trust `householdId` without verifying membership.

### A02 Cryptographic Failures
- Hash passwords with Argon2/bcrypt.
- Use HTTPS in production.
- Never log secrets, tokens, or passwords.

### A03 Injection
- Prisma already parameterizes queries, but validate inputs strictly (Zod).
- Never build raw SQL strings from user input.

### A04 Insecure Design
- Threat model basic flows (login, household access, inventory ops).
- Use secure defaults.

### A05 Security Misconfiguration
- Secure headers (Helmet)
- Disable detailed error leaks in production
- Limit CORS to known origins

### A06 Vulnerable Components
- Keep dependencies updated (pnpm audit)
- Avoid installing unnecessary packages

### A07 Identification & Authentication Failures
- Rate limit login/register
- Secure refresh token handling
- Rotate refresh tokens if possible

### A08 Software & Data Integrity Failures
- Lockfile committed
- CI runs tests
- Avoid running untrusted scripts

### A09 Security Logging & Monitoring Failures
- Log auth events (login, logout, refresh) without sensitive data
- Log access denied events

### A10 SSRF
- If adding external fetches later, validate URLs and block private IP ranges.

## 5) Security Middleware (Backend MVP)

- `helmet` for security headers
- rate limiter (Fastify plugin or simple middleware)
- strict request validation (Zod)
- centralized error handler (no stack traces in prod)

## 6) Data Protection

- Separate user data from domain data.
- Principle of least privilege in DB user.
- Do not store plaintext secrets.
- Use environment variables for config.

## 7) Secrets & Environment

- `.env` never committed
- Provide `.env.example`
- Separate configs for dev/prod

## 8) Security Testing (later)

- Basic auth tests (unauthorized → 401)
- authorization tests (wrong household → 403)
- rate limit tests (optional)
