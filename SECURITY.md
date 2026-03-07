# SECURITY.md — Security Requirements & Checklist

This project handles user accounts and household data. Security must be designed in from the start.

## 1) Minimum Security Goals

- Authentication required for any household data access.
- Authorization based on membership: users can only access their households.
- Secure password storage (Argon2).
- Basic OWASP Top 10 protections applied.
- No sensitive data in logs (passwords, tokens).

## 2) Auth & Session Strategy (Implemented)

Current authentication model:

- Auth: email + password
- Password hashing: Argon2
- Session model: short-lived JWT access token + refresh token
- Refresh token stored in **httpOnly cookie**
- Access token sent via `Authorization: Bearer`
- Automatic refresh flow from frontend
- Logout endpoint invalidates refresh cookie

### Session Flow

1. User logs in or registers.
2. Backend returns a **JWT access token**.
3. Backend sets a **refresh token cookie (httpOnly)**.
4. Client uses the access token for protected endpoints.
5. If access token expires:
   - frontend calls `/auth/refresh`
   - backend validates refresh cookie
   - new access token is issued
6. If refresh fails:
   - frontend clears session
   - user must login again.

This model improves security while maintaining a smooth user experience.

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

Mitigations implemented:

- Passwords hashed using **Argon2**
- Access tokens are **short-lived JWT**
- Refresh tokens stored in **httpOnly cookies**
- Access tokens never stored in cookies
- Automatic refresh handled by frontend
- Session invalidation through `/auth/logout`
- Household membership validated on every protected endpoint

Future improvements:
- Refresh token rotation
- Login rate limiting
- optional MFA support

### A08 Software & Data Integrity Failures
- Lockfile committed.
- CI should run tests (recommended).
- Avoid running untrusted scripts.

### A09 Security Logging & Monitoring Failures
- Log auth events (login/register failures, forbidden access) without sensitive data.
- Record 401/403 events at least at info/warn level.

### A10 SSRF
- Future external fetches must validate URLs and block private IP ranges.

## 5) Security Middleware (Backend)

Currently implemented:

- Strict request validation using **Zod contracts**
- Authentication middleware validating **JWT access tokens**
- Household membership validation on protected routes
- Secure cookie usage for refresh tokens
- Centralized error handling
- No sensitive data logged (passwords, tokens)

Recommended future additions:

- `helmet` security headers
- login rate limiting
- refresh token rotation

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

## 9) Session Security Summary

The system uses a **two-token session model**:

Access Token:
- JWT
- short-lived
- sent in Authorization header

Refresh Token:
- stored in httpOnly cookie
- not accessible to JavaScript
- used only by `/auth/refresh`

Logout:
- clears refresh cookie
- frontend removes access token

This approach balances security with usability for mobile and web clients.