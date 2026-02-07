# HTTP API – Examples

This document contains example HTTP requests and responses for the current API endpoints.
All examples are **internally consistent**, meaning that following them step by step will always produce non-empty, meaningful results.

---

## Common test identifiers

For all examples below, the following UUIDs are used consistently:

- **Household**
  - `550e8400-e29b-41d4-a716-446655440000`

- **Ingredients**
  - Milk: `22222222-2222-2222-2222-222222222222`
  - Rice: `33333333-3333-3333-3333-333333333333`
  - Eggs (not in inventory): `44444444-4444-4444-4444-444444444444`

- **Recipes**
  - Milk & Cereal: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
  - Rice Bowl: `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`

---

## POST /inventory/update

Adds or updates ingredients in the household inventory.

### Request (PowerShell)

```powershell
$householdId = "550e8400-e29b-41d4-a716-446655440000"

$body = @{
  householdId = $householdId
  operations = @(
    @{
      type="ADD"
      ingredientId="22222222-2222-2222-2222-222222222222" # milk
      amount=2
      expirationDate="2026-02-05"
    },
    @{
      type="ADD"
      ingredientId="33333333-3333-3333-3333-333333333333" # rice
      amount=1
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/inventory/update -ContentType "application/json" -Body $body |
  ConvertTo-Json -Depth 20
```

### Resulting inventory state
- Milk: 2 units
- Rice: 1 unit

---

## POST /suggestions/generate

Generates a daily meal suggestion based on the current inventory and persisted recipes.

> **Precondition**: Recipes must be seeded using `pnpm -C apps/api seed:recipes`.

### Request (PowerShell)

```powershell
$body = @{
  householdId = "550e8400-e29b-41d4-a716-446655440000"
  date = "2026-02-03"
  slot = "CENA"
  maxSuggestions = 3
  expiringDaysThreshold = 3
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/suggestions/generate -ContentType "application/json" -Body $body |
  ConvertTo-Json -Depth 20
```

### Example Response (200 OK)

```json
{
  "householdId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-02-03",
  "slot": "CENA",
  "status": "PROPUESTA",
  "recipes": [
    { "recipeId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "name": "Milk & Cereal" },
    { "recipeId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "name": "Rice Bowl" }
  ],
  "reasoning": {
    "usedExpiringIngredients": ["22222222-2222-2222-2222-222222222222"],
    "totalCandidateRecipes": 2
  }
}
```

---

## POST /shopping-list/from-recipes

Generates a shopping list by loading recipes from the database and comparing required ingredients against the current inventory.

### Request (PowerShell)

```powershell
$body = @{
  householdId = "550e8400-e29b-41d4-a716-446655440000"
  recipeIds = @(
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/shopping-list/from-recipes -ContentType "application/json" -Body $body |
  ConvertTo-Json -Depth 20
```

### Example Response (200 OK)

```json
{
  "householdId": "550e8400-e29b-41d4-a716-446655440000",
  "items": []
}
```

### Why the list is empty

- Milk recipe requires 1 unit → inventory has 2
- Rice recipe requires 1 unit → inventory has 1

No ingredients are missing, therefore the shopping list is empty.

---

## POST /shopping-list/generate (explicit ingredients)

Generates a shopping list using ingredient requirements provided directly by the client.
This endpoint is mainly useful for testing and comparison.

### Request (PowerShell)

```powershell
$body = @{
  householdId = "550e8400-e29b-41d4-a716-446655440000"
  recipes = @(
    @{
      recipeId = "test-recipe"
      ingredients = @(
        @{ ingredientId="22222222-2222-2222-2222-222222222222"; amount=3 } # milk
        @{ ingredientId="44444444-4444-4444-4444-444444444444"; amount=2 } # eggs
      )
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/shopping-list/generate -ContentType "application/json" -Body $body |
  ConvertTo-Json -Depth 20
```

### Example Response (200 OK)

```json
{
  "householdId": "550e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "ingredientId": "22222222-2222-2222-2222-222222222222",
      "missingAmount": 1
    },
    {
      "ingredientId": "44444444-4444-4444-4444-444444444444",
      "missingAmount": 2
    }
  ]
}
```

---

## Notes

- All identifiers are validated as UUIDs at runtime.
- Inventory and recipes are persisted using PostgreSQL (Prisma).
- Following the examples in order guarantees coherent, reproducible results.

---

## POST /suggestions/accept

Accepts a persisted daily suggestion and updates its status to `ACEPTADA`.
On acceptance, the system **consumes inventory** according to the ingredients required by the suggested recipes.

### Flow (recommended)
1) `POST /suggestions/generate` → get `suggestionId`
2) `POST /suggestions/accept` using that `suggestionId`
3) `GET /suggestions/daily?...` → status should be `ACEPTADA`

### Request (PowerShell)

```powershell
$body = @{
  suggestionId = "<PASTE_SUGGESTION_ID_HERE>"
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/suggestions/accept -ContentType "application/json" -Body $body |
  ConvertTo-Json -Depth 20
```

### Example Response (200 OK)

```json
{
  "suggestionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "ACEPTADA"
}
```

---

## Notes

- If inventory is insufficient, the API may return 409 Conflict.
- Accepting an already accepted suggestion is idempotent and returns ACEPTADA.

---

