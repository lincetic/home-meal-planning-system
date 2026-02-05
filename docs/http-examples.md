# HTTP API – Examples

This document contains example HTTP requests and responses for the current API endpoints.

## Base URL
```bash
http://127.0.0.1:3000
```
## POST /inventory/update

Updates the inventory of a household by adding or consuming ingredients.

### Request (PowerShell)
```bash
$body = @{
  householdId = "550e8400-e29b-41d4-a716-446655440000"
  operations = @(
    @{
      type="ADD"
      ingredientId="550e8400-e29b-41d4-a716-446655440000"
      amount=2
      expirationDate="2026-02-05"
    }
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/inventory/update -ContentType "application/json" -Body $body
```

## Response (200 OK)
```json
{
  "householdId": "550e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "ingredientId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2,
      "expirationDate": "2026-02-05"
    }
  ]
}
```

## Notes
- Request is validated using shared contracts (packages/contracts)
- Inventory is stored in-memory (no persistence yet)