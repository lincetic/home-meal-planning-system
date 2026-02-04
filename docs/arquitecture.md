# Architecture

## 1. Purpose
This project is a TFM prototype to build a home meal planning assistant focused on:
- reducing daily decision fatigue (“what do we eat today?”)
- using available ingredients before they expire
- generating shopping lists automatically

The architecture prioritizes:
- maintainability (Clean Architecture)
- testability (domain-first, unit tests)
- evolvability (easy to add persistence, APIs, UI clients)

## 2. High-level overview
The repository is a monorepo with multiple apps and shared packages.

- `apps/api`: Backend (domain + application + future infrastructure/interfaces)
- `apps/mobile`: User mobile app (future)
- `apps/admin`: Admin panel (future)
- `packages/contracts`: Shared DTOs/contracts between clients and API (in progress)

## 3. Architectural style
We use **Clean Architecture** + a lightweight DDD approach.

Key rules:
- Domain does not depend on frameworks or infrastructure.
- Use cases orchestrate domain behavior.
- Infrastructure implements interfaces (ports) defined by the application layer.
- Controllers/adapters translate external input into use cases.

## 4. Layers and responsibilities

### 4.1 Domain (`apps/api/src/domain`)
Contains:
- Entities (e.g., `Inventory`, `InventoryItem`)
- Value Objects (e.g., `Quantity`)
- Domain services (future: `MealPlanner`)
- Domain invariants (e.g., quantities cannot be negative)

Goals:
- Model business rules
- Keep logic framework-agnostic
- Maximize unit test coverage

### 4.2 Application (`apps/api/src/application`) (future)
Contains:
- Use cases (e.g., `GenerateDailySuggestion`, `GenerateShoppingList`)
- Ports (interfaces) for repositories/services
- Input/output DTOs at the use-case boundary (not HTTP DTOs)

Goals:
- Orchestrate domain objects
- Keep business workflow explicit
- Be easily testable with fakes/mocks

### 4.3 Infrastructure (`apps/api/src/infrastructure`) (future)
Contains:
- DB/ORM implementations (PostgreSQL + Prisma planned)
- Repository implementations
- External integrations (auth, notifications, jobs)

Goal:
- Provide technical details without leaking them into the domain

### 4.4 Interfaces (`apps/api/src/interfaces`) (future)
Contains:
- REST controllers, routes
- HTTP request/response mapping
- Input validation using shared contracts

Goal:
- Translate HTTP <-> application use cases

## 5. Dependency direction
Dependency rule:
- interfaces -> application -> domain
- infrastructure -> application -> domain


Domain never imports from other layers.

## 6. Current implemented domain (MVP)
Implemented and tested:
- `Quantity` (Value Object): non-negative, immutable operations
- `InventoryItem` (Entity): holds ingredientId, quantity, optional expiration date
- `Inventory` (Aggregate Root): one item per ingredientId, merge quantities, consume and remove at zero, expiring-soon queries

## 7. Testing strategy
- Domain: unit tests with Vitest (fast, pure, no DB)
- Application (future): unit tests using fake repositories
- Infrastructure (future): integration tests (DB/container)

## 8. Planned evolution (roadmap)
Next steps:
1. Define application ports (repositories) for inventory, recipes, suggestions
2. Implement first use case(s):
   - `UpdateInventory`
   - `GenerateDailySuggestion` (rules-based initially)
3. Introduce persistence:
   - PostgreSQL + Prisma (infra layer)
4. Add REST API controllers (interfaces layer)
5. Start mobile and admin apps consuming `packages/contracts`

## 9. Notes and tradeoffs
- Expiration modeling is currently simplified (one expiration date per ingredient). In future, support batches/lots.
- IDs are currently represented as strings in domain; stricter ID types can be introduced later.
