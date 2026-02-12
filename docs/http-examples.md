# HTTP API -- Examples

This document contains example HTTP requests and responses for the
current API endpoints.\
All examples are **internally consistent**, meaning that following them
step by step will always produce non-empty, meaningful results.

> ⚠️ Ingredient IDs are NOT hardcoded anymore.\
> They must be obtained from the catalog using `/ingredients/search`.

------------------------------------------------------------------------

# 0️⃣ Precondition (important)

Before running these examples:

``` bash
pnpm -C apps/api seed:ingredients
pnpm -C apps/api seed:recipes
```

Household used in all examples:

    550e8400-e29b-41d4-a716-446655440000

Recipes (fixed IDs from seed):

-   Milk & Cereal → `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
-   Rice Bowl → `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`

------------------------------------------------------------------------

# 1️⃣ Find Ingredient IDs from Catalog

## Search Milk

``` powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3000/ingredients/search?q=leche&limit=5" |
  ConvertTo-Json -Depth 20
```

Copy the returned `id`.

------------------------------------------------------------------------

## Search Rice

``` powershell
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3000/ingredients/search?q=arroz&limit=5" |
  ConvertTo-Json -Depth 20
```

Copy the returned `id`.

------------------------------------------------------------------------

# 2️⃣ POST /inventory/update

Adds ingredients to inventory using real catalog IDs.

``` powershell
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

Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:3000/inventory/update `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 20
```

Resulting inventory: - Milk: 2 - Rice: 1

------------------------------------------------------------------------

# 3️⃣ POST /suggestions/generate

Generates and persists a daily suggestion.

``` powershell
$body = @{
  householdId = "550e8400-e29b-41d4-a716-446655440000"
  date = "2026-02-03"
  slot = "CENA"
  maxSuggestions = 3
  expiringDaysThreshold = 3
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/suggestions/generate `
  -ContentType "application/json" `
  -Body $body

$response | ConvertTo-Json -Depth 20
```

Save the `suggestionId` returned.

------------------------------------------------------------------------

# 4️⃣ GET /suggestions/daily

``` powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:3000/suggestions/daily?householdId=550e8400-e29b-41d4-a716-446655440000&date=2026-02-03&slot=CENA" |
  ConvertTo-Json -Depth 20
```

Status should be `PROPUESTA`.

------------------------------------------------------------------------

# 5️⃣ POST /suggestions/modify

``` powershell
$body = @{
  suggestionId = "<PASTE_SUGGESTION_ID>"
  recipeIds = @(
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/suggestions/modify `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 20
```

------------------------------------------------------------------------

# 6️⃣ POST /suggestions/accept

``` powershell
$body = @{
  suggestionId = "<PASTE_SUGGESTION_ID>"
} | ConvertTo-Json -Depth 3

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/suggestions/accept `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 20
```

------------------------------------------------------------------------

# 7️⃣ POST /shopping-list/from-recipes

``` powershell
$body = @{
  householdId = "550e8400-e29b-41d4-a716-446655440000"
  recipeIds = @(
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/shopping-list/from-recipes `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 20
```

------------------------------------------------------------------------

# Notes

-   Ingredient IDs are obtained dynamically from the catalog.
-   All identifiers are validated as UUIDs.
-   Inventory and recipes are persisted using PostgreSQL (Prisma).
-   Accepting a suggestion consumes inventory.
-   Modifying does NOT consume inventory.
