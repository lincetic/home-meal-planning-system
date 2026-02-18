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

Dependencies always point **inwards**, towards the domain.

---

## 2. High-level architecture

```
┌─────────────────────────────┐
│ Web App                     │
│ (React + Tailwind CSS)      │
└──────────────┬──────────────┘
↓
┌─────────────────────────────┐
│ Interfaces                  │
│ (HTTP / Fastify API)        │
└──────────────┬──────────────┘
↓
┌─────────────────────────────┐
│ Application                 │
│ (Use Cases / Ports)         │
└──────────────┬──────────────┘
↓
┌─────────────────────────────┐
│ Domain                      │
│ (Entities / Value Objects)  │
└──────────────┬──────────────┘
↑
┌─────────────────────────────┐
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

- **AcceptSuggestionUseCase**
  - Load suggestion + inventory + recipes 
  - Consume each recipe ingredient
  - Persist inventory + set status accepted

- **ModifySuggestionUseCase**
  - Load suggestion + recipes
  - Ensure all recipeIds exist
  - Persist: overwrite recipes + set status MODIFICADA

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

Repositories:
- Load database rows and reconstruct domain aggregates
- Persist domain state back to the database

### Database model

- `Household`
  - Owns inventory and recipes

- `InventoryItem`
  - ingredientId
  - quantity
  - expirationDate

- `Recipe`
  - name
  - householdId

- `RecipeIngredient`
  - ingredientId
  - amount

The database schema is intentionally **not a 1:1 mirror** of the domain model.

---

## 6. Interfaces layer (HTTP API)

### Responsibilities
- Input validation
- Mapping HTTP requests to use cases
- Mapping use case output to HTTP responses

### Framework
- **Fastify**

### Validation
- Runtime validation using **Zod**
- Shared contracts via `packages/contracts`

### Implemented endpoints

- `POST /inventory/update`
- `POST /suggestions/generate`
- `POST /shopping-list/generate`
- `POST /shopping-list/from-recipes`
- `POST /suggestions/accept`
- `POST /suggestions/modify`
- `POST /plan/today`
- `GET /inventory`
- `GET /ingredients/search`
- `GET /ingredients/by-ids`


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
- **Integration tests (manual)**: HTTP endpoints with real database

Tests are executed using **Vitest**.

---

## 9. Current system state

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


### Not implemented yet (future work)
- User management and authentication
- Persisted meal suggestions (accept/reject flow)
- Nutritional analysis

---

## 10. Summary

The current architecture provides:
- A clean separation between business logic and infrastructure
- A testable, evolvable core
- A solid backend foundation suitable for extension and frontend integration

This structure supports incremental development while keeping technical debt low.

