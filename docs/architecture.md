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
  - one item per ingredient
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
  - Prioritizes ingredients expiring soon

- **GenerateShoppingListUseCase**
  - Generates shopping list from explicit ingredient requirements

- **GenerateShoppingListFromRecipesUseCase**
  - Loads recipes from persistence
  - Aggregates ingredient requirements
  - Compares against inventory to determine missing items

- **GenerateAndStoreDailySuggestionUseCase**
  - Generates and persists a daily suggestion

- **AcceptSuggestionUseCase**
  - Load suggestion + inventory + recipes
  - Consume selected recipe ingredients
  - Persist inventory + set status ACEPTADA

- **ModifySuggestionUseCase**
  - Load suggestion + recipes
  - Ensure all recipeIds exist
  - Persist: overwrite recipes + set status MODIFICADA

- **GetCookingPlanUseCase**
  - Orchestrates the main cooking decision flow
    - Returns:
      - `SUGGESTION`
      - `NEEDS_SHOPPING`
      - accepted state inside the suggestion model
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

### Database model

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
- `POST /auth/refresh`
- `POST /auth/logout`

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

## 8. Authentication and session model

The system now uses a two-token session model:

### Access token
- JWT
- short-lived
- sent in `Authorization: Bearer ...`

### Refresh token
- longer-lived
- stored in httpOnly cookie
- used only by /auth/refresh

### Session flow
- login/register returns access token
- refresh token is set as cookie
- frontend retries protected calls automatically after refresh
- logout clears refresh cookie and local access token
This design improves security and UX:
- short-lived access credentials
- reduced re-login frequency
- protection against direct JavaScript access to refresh token

---

## 9. Web Demo architecture

The Web Demo has evolved from a single-page dense layout into a mobile-first two-tab interface.

### Current UI structure
- **Plan tab**
  - primary entry point
  - shows today’s suggestion / accepted recipe / shopping fallback
- **Inventory tab**
  - ingredient search
  - add inventory items
  - inventory list and expirations

### Why this matters architecturally
- The backend remains unchanged
- The frontend reorganizes the same use cases around a more focused user journey
- The main decision flow is now centered on the daily cooking plan, which better reflects the project’s main purpose

## 10. Testing strategy

- **Domain tests**: entities and value objects
- **Application tests**: use cases (business behavior)
- **HTTP tests**:
  - unauthenticated → 401
  - wrong household → 403
  - correct household → 200
- **Integration/manual tests**: end-to-end flow through Web Demo

Tests are executed using **Vitest**.

---

## 11. Current system state

### Completed
- Clean Architecture structure
- Domain modeling (Inventory, Recipe)
- Inventory persistence with PostgreSQL
- Recipe persistence with PostgreSQL
- Suggestion persistence
- Cooking Plan use case (`/plan/today`)
- Shopping list generation
- Runtime contract validation
- Web Demo (React + Tailwind)
- End-to-end flow operational
- Persisted meal suggestions per household + date + slot
- Suggestion state machine: PROPUESTA → ACEPTADA
- `acceptedRecipeId` persistence
- Idempotent acceptance behavior
- Cooking Plan orchestration endpoint `/plan/today`
- Authentication and authorization
- Refresh token in cookie httpOnly
- Frontend automatic token refresh
- Mobile-first tab-based UI (`Plan` / `Inventory`)

### Not implemented yet (future work)
- Native mobile app
- Refresh token persistence / rotation store in database
- Password reset flow
- Nutritional analysis
- Admin panel

---

## 12. Summary

The current architecture provides:
- A clean separation between business logic and infrastructure
- A testable, evolvable core
- A secure authentication/session baseline
- A frontend demo aligned with mobile-first usage

This structure supports incremental development while keeping technical debt low.