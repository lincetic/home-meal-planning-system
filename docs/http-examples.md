# HTTP API -- Examples

This document contains example HTTP requests and responses for the
current API endpoints.

All examples are internally consistent and reflect the secured API
(JWT authentication required for protected routes).

------------------------------------------------------------------------

# 0️⃣ Precondition (important)

Before running these examples:

```bash
pnpm -C apps/api seed:ingredients
pnpm -C apps/api seed:recipes
```
## Demo household (seed)

The seed scripts create a demo household:

```
550e8400-e29b-41d4-a716-446655440000
```
This is the household used by the seeded demo user.
When you register a new user, the backend creates a new household for that user and clones demo recipes into it.

Notes:

- You can also register a new user and use the household returned by `/auth/me`.
- The demo seed user is `demo@tfm.local` (see seed scripts).

# Authentication Flow

The system uses a **two-token authentication model**.

## Access Token

Short-lived JWT returned by:
- `POST /auth/login`
- `POST /auth/register`
Used in requests:
- `Authorization: Bearer <token>`

---

## Refresh Token

A refresh token is stored in a **httpOnly cookie**.

Used by:
- `POST /auth/refresh`


The frontend automatically calls this endpoint when the access token expires.

If the refresh token is valid:

- a new access token is returned
- the original request is retried automatically

If refresh fails:

- the session is cleared
- the user must login again.

---

# Login Example

```powershell
$loginBody = @{
  email = "demo@tfm.local"
  password = "Password123!"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/auth/login `
  -ContentType "application/json" `
  -Body $loginBody

$token = $response.accessToken
```
Use token:
```powershell
Authorization: Bearer $token
```
# Refresh Token Example

- `POST /auth/refresh`

No body required.

Uses cookie automatically.

Example:
```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/auth/refresh
```

Response:
```json
{
  "accessToken": "..."
}
```

# Logout Example

- `POST /auth/logout`

Example:
```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/auth/logout
```

Logout will:
- invalidate the refresh token cookie
- require the user to login again.

# 1️⃣ Authentication (REQUIRED for protected routes)

All protected endpoints require a valid JWT.

## Option A — Login with seeded demo user
```powershell
$loginBody = @{
  email = "demo@tfm.local"
  password = "Password123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/auth/login `
  -ContentType "application/json" `
  -Body $loginBody

$token = $loginResponse.accessToken
```

## Option B — Register a new user (creates a new household)
```powershell
$registerBody = @{
  email = "new-user@tfm.local"
  password = "Password123!"
  name = "New User"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/auth/register `
  -ContentType "application/json" `
  -Body $registerBody

$token = $registerResponse.accessToken
```

## /auth/me — get householdId for the authenticated user
```powershell
$me = Invoke-RestMethod `
  -Method Get `
  -Uri http://127.0.0.1:3000/auth/me `
  -Headers @{ Authorization = "Bearer $token" }

$householdId = $me.households[0].id
$householdId
```

All subsequent protected calls must include:
```powershell
-Headers @{ Authorization = "Bearer $token" }
```

# 2️⃣ Find Ingredient IDs from Catalog (PUBLIC)

These endpoints are public in the MVP.

## Search Milk
```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:3000/ingredients/search?q=leche&limit=5"
```
Copy the returned id.

## Search Rice
```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:3000/ingredients/search?q=arroz&limit=5"
```
Copy the returned id.

# 3️⃣ POST /inventory/update (Protected)

Adds ingredients to inventory.

```powershell
$householdId = "550e8400-e29b-41d4-a716-446655440000"
$milkId = "<PASTE_MILK_ID>"
$riceId = "<PASTE_RICE_ID>"

$body = @{
  householdId = $householdId
  operations = @(
    @{
      type="ADD"
      ingredientId=$milkId
      amount=2
      expirationDate="2026-02-05"
    },
    @{
      type="ADD"
      ingredientId=$riceId
      amount=1
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/inventory/update `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

# 4️⃣ POST /suggestions/generate (Protected)

Generates and persists a daily suggestion.
```powershell
$body = @{
  householdId = $householdId
  date = "2026-02-03"
  slot = "CENA"
  maxSuggestions = 3
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/suggestions/generate `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body

$response
```

Save the suggestionId.

# 5️⃣ GET /suggestions/daily (Protected)
```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:3000/suggestions/daily?householdId=$householdId&date=2026-02-03&slot=CENA" `
  -Headers @{ Authorization = "Bearer $token" }
```

# 6️⃣ POST /suggestions/modify (Protected)

Overwrite the recipes of a suggestion (does NOT consume inventory).
```powershell
$body = @{
  suggestionId = "<PASTE_SUGGESTION_ID>"
  recipeIds = @(
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
  )
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/suggestions/modify `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

# 7️⃣ POST /suggestions/accept (Protected)

Accepts a suggestion and (optionally) selects which recipe to accept.
```powershell
$body = @{
  suggestionId = "<PASTE_SUGGESTION_ID>"
  recipeId = "<PASTE_RECIPE_ID_FROM_SUGGESTION>"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/suggestions/accept `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

# 8️⃣ POST /shopping-list/from-recipes (Protected)
```powershell
$body = @{
  householdId = $householdId
  recipeIds = @(
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
  )
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/shopping-list/from-recipes `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

# 9️⃣ POST /plan/today (Protected)

## Example: SUGGESTION (not accepted yet)
```powershell
$body = @{
  householdId = $householdId
  date = "2026-02-03"
  slot = "CENA"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/plan/today `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

## After acceptance

Call again:
```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/plan/today `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body $body
```

Response will include:
```json
{
  "kind": "SUGGESTION",
  "status": "ACEPTADA",
  "acceptedRecipeId": "..."
}
```

# Authorization Behavior

- Missing token → 401
- Invalid token → 401
- Wrong householdId → 403
- Valid token + correct household → 200

# Notes

- All IDs are UUID strings.
- Dates are `YYYY-MM-DD`.
- Passwords are hashed using Argon2.
- Household membership is validated on protected endpoints.
- Accepting a suggestion consumes inventory.
- Modifying a suggestion does NOT consume inventory.