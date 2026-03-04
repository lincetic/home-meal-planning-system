# Architecture Overview

This document describes the current architecture of the **Home Meal Planning System**, its layers, responsibilities, and the current implementation state.

---

## 1. Architectural style

The system follows **Clean Architecture** principles with a lightweight Domain-Driven Design (DDD) approach.

Key goals:
- Business rules independent of frameworks
- Clear separation of concerns
- Testable core logic
- Infrastructure treated as an implementation detail

Dependencies always point **inwards**.

---

## 2. High-level architecture

```
┌─────────────────────────────┐
│ Web App                     │
│ (React + Tailwind CSS)      │
└──────────────┬──────────────┘
               | HTTP (JSON)
               ↓ 
┌─────────────────────────────┐
│ Interfaces                  │
│ (HTTP / Fastify API)        │
└──────────────┬──────────────┘
               | invokes
               ↓
┌─────────────────────────────┐
│ Application                 │
│ (Use Cases / Ports)         │
└──────────────┬──────────────┘
               | uses
               ↓
┌─────────────────────────────┐
│ Domain                      │
│ (Entities / Value Objects)  │
└─────────────────────────────┘
               ↑
               | implemented by
┌──────────────┴──────────────┐
│ Infrastructure              │
│ (Prisma / PostgreSQL)       │
└─────────────────────────────┘
```

---

## 3. Domain layer

### Responsibilities
- Encapsulate business rules
- Maintain invariants
- Remain framework-agnostic

### Main concepts

#### Inventory (Aggregate Root)
- Owns and manages inventory items
- Guarantees:
  - no negative quantities
  - one item per ingredient (MVP)
  - proper expiration handling

#### InventoryItem (Entity)
- Ingredient identifier
- Quantity (Value Object)
- Optional expiration date

#### Recipe (Entity)
- Recipe identifier
- Name
- Collection of required ingredients

#### Value Objects
- Quantity

The domain layer has **no knowledge of persistence, HTTP, or frameworks**.

---

## 4. Application layer

### Responsibilities
- Orchestrate domain logic
- Implement business use cases
- Define ports (interfaces) for infrastructure

### Implemented use cases

- **UpdateInventoryUseCase**
  - Adds or consumes inventory items

- **GenerateDailySuggestionUseCase**
  - Suggests meals based on inventory availability
  - Can prioritize ingredients expiring soon (MVP heuristics)

- **GenerateShoppingListUseCase**
  - Generates shopping list from explicit ingredient requirements

- **GenerateShoppingListFromRecipesUseCase**
  - Loads recipes from persistence
  - Aggregates ingredient requirements
  - Compares against inventory to determine missing items

- **GenerateAndStoreDailySuggestionUseCase**
  - Orchestrates suggestion generation + persistence (one per household/date/slot)

- **AcceptSuggestionUseCase**
  - Load suggestion + inventory + recipes
  - Consume each recipe ingredient
  - Persist inventory + set status accepted + persist acceptedRecipeId

- **ModifySuggestionUseCase**
  - Load suggestion + recipes
  - Ensure all recipeIds exist
  - Persist: overwrite recipes + set status MODIFICADA

- **Cooking Plan orchestration**
  - GetCookingPlanUseCase
    - Returns:
      - `kind="SUGGESTION"` (with `status` and `acceptedRecipeId` if accepted)
      - `kind="NEEDS_SHOPPING"` (minimal list to unlock 1 recipe)
  - Does not regenerate suggestions if already accepted.

All use cases are covered by unit tests.

---

## 5. Infrastructure layer

### Responsibilities
- Implement persistence and external services
- Translate between domain objects and storage models

### Persistence
- **PostgreSQL** used as relational database
- **Prisma ORM** used for database access and migrations

#### Implemented repositories
- `PrismaInventoryRepository`
- `PrismaRecipeRepository`
- `PrismaSuggestionRepository`

Repositories:
- Load database rows and reconstruct domain aggregates
- Persist domain state back to the database

### Database model (main concepts)

- `User`
  - email, passwordHash (Argon2), name

- `Household`
  - owner/root for inventory + recipes + suggestions

- `HouseholdMember`
  - join table: userId + householdId + role (OWNER/MEMBER)

- `InventoryItem`
  - ingredientId, quantity, expirationDate
  - unique constraint by `(householdId, ingredientId)` (MVP)

- `Recipe` + `RecipeIngredient`
  - recipes belong to a household
  - ingredients stored as normalized rows

- `MealSuggestion` + `MealSuggestionRecipe`
  - persisted daily suggestions per household/date/slot
  - includes `status` and `acceptedRecipeId` (nullable)
  - important rule: upserts must **not** accidentally wipe `acceptedRecipeId`

The database schema is intentionally **not a 1:1 mirror** of the domain model.

---

## 6. Interfaces layer (HTTP API)

### Responsibilities
- Input validation
- Mapping HTTP requests to use cases
- Mapping use case output to HTTP responses
- Authentication + Authorization checks

### Framework
- **Fastify**

### Validation
- Runtime validation using **Zod**
- Shared contracts via `packages/contracts`

### Authentication & Authorization
- Authentication: JWT access token (`Authorization: Bearer <token>`)
- Authorization: household membership enforced for household-scoped endpoints:
  - Missing/invalid token → 401
  - Valid token but not member of household → 403

### Implemented endpoints

Auth:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Household-scoped (protected):
- `POST /inventory/update`
- `GET /inventory`
- `POST /suggestions/generate`
- `GET /suggestions/daily`
- `POST /suggestions/modify`
- `POST /suggestions/accept`
- `POST /shopping-list/generate`
- `POST /shopping-list/from-recipes`
- `POST /plan/today`

Public (MVP convenience):
- `GET /ingredients/search`
- `GET /ingredients/by-ids`
- `POST /ingredients` (create ingredient)

---

## 7. Contracts package

A shared package (`packages/contracts`) defines:
- Request/response schemas (Zod)
- Runtime validation
- Shared TypeScript types

This ensures:
- API consistency
- Single source of truth for contracts
- Strong validation boundaries

---

## 8. Testing strategy

- **Domain tests**: entities and value objects
- **Application tests**: use cases (business behavior)
- **HTTP tests**:
  - auth routes
  - authorization checks (401 / 403 / 200)

Tests are executed using **Vitest**.

---

## 9. Current system state

### Completed
- Clean Architecture structure
- Domain modeling (Inventory, Recipe)
- Persistence with PostgreSQL + Prisma
- Suggestion persistence (daily, per household/date/slot)
- Cooking Plan orchestration endpoint (`POST /plan/today`)
- Shopping list generation
- Runtime contract validation (request + response)
- Web Demo (React + Tailwind) with login/register
- End-to-end flow operational
- Suggestion state machine: `PROPUESTA → ACEPTADA` (and `MODIFICADA`)
- `acceptedRecipeId` persistence + idempotent acceptance behavior
- Household membership authorization (401/403 behavior)

### Not implemented yet (future work)
- Refresh token rotation
- Password reset flow
- Multi-user household management UI (invite/join)
- Nutritional analysis

---

## 10. Summary

The current architecture provides:
- A clean separation between business logic and infrastructure
- A testable, evolvable core
- A secured API foundation (auth + household authorization)
- A working demo flow suitable for TFM evaluation