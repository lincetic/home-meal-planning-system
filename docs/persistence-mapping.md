# Persistence Mapping (Domain ↔ Database)

## 1. Why the database model does not match the domain 1:1

This project follows **Clean Architecture** with a domain-first approach.

- The **Domain Model** represents business concepts and rules (behavior).
- The **Database Model** represents storage, relationships and query efficiency (data).

Therefore, **a domain entity does not need to correspond to a database table**.  
Instead, persistence is implemented through repositories that **translate** between both models.

> Key idea: the database is an implementation detail; the domain is the source of truth.

---

## 2. Domain model (business perspective)

### Inventory (Aggregate Root)
In the domain, `Inventory` is an **Aggregate Root** responsible for maintaining consistency rules:

- there is only one item per `ingredientId` (MVP simplification)
- quantities cannot be negative
- consuming an ingredient removes the item when quantity reaches zero
- expiration dates are optional and influence planning heuristics

`Inventory` is a behavior-centric object:
- not just data storage
- it encapsulates invariants and operations

### InventoryItem (Entity)
`InventoryItem` represents a specific ingredient inside an inventory, including:
- ingredientId
- quantity (as a Value Object)
- expiration date (optional)

It contains behavior such as:
- `consume(...)`
- `add(...)`

### Household (concept)
At domain level, a **household** is the owner of:
- shared inventory
- recipes
- daily suggestions / cooking plan history

In the current implementation:
- each user belongs to at least one household (membership)
- the demo seed creates one household + one demo user
- registering a new user creates a new household for that user (MVP choice to keep onboarding simple)

---

## 3. Database model (persistence perspective)

In the database we store **data that can be indexed and queried efficiently**.

### Tables (Prisma models) — relevant to the mapping

**Identity / Authorization**
- `User`
- `Household`
- `HouseholdMember` (join table with role)

**Inventory**
- `InventoryItem`
  - uniquely constrained by `(householdId, ingredientId)`

**Recipes**
- `Recipe`
- `RecipeIngredient`

**Suggestions / Cooking Plan**
- `MealSuggestion`
  - unique by `(householdId, date, slot)`
  - contains `status` and nullable `acceptedRecipeId`
- `MealSuggestionRecipe`
  - stores the suggested recipes (recipeId, recipeName, position)

### Why there is no `Inventory` table
In the MVP, an inventory is always tied to exactly one household.  
So in persistence:
- `Inventory` is represented by the collection of `InventoryItem` rows belonging to a `Household`.

This avoids an extra table that would provide no additional information in the MVP.

---

## 4. Mapping rules (Repository responsibilities)

A repository in the infrastructure layer performs translations in both directions.

### 4.1 Load: DB → Domain
When loading an inventory:
1. fetch `InventoryItem` rows for a given household
2. map each row into a domain `InventoryItem`:
   - `Quantity.create(quantity)`
   - `expirationDate` as `Date | undefined`
3. build the domain `Inventory` Aggregate Root using those items

Result:
- The domain receives a fully valid `Inventory` object with business behavior.

### 4.2 Save: Domain → DB
When saving an inventory:
1. ensure the household exists (upsert)
2. take the current state of the aggregate (`inventory.getItems()`)
3. persist it to the database

MVP strategy:
- replace all rows for the household (`deleteMany` + `createMany`)

This is simple and correct for early development.
Later, this can be optimized using incremental updates (diff-based writes).

---

## 5. Suggestion persistence rules (important invariants)

Daily suggestions are persisted as `MealSuggestion` per:
- householdId
- date (YYYY-MM-DD)
- slot (DESAYUNO/COMIDA/CENA)

Key rules:
- Once a suggestion is **accepted**, `acceptedRecipeId` must be stored.
- Future upserts (e.g., regenerating a suggestion) must **NOT wipe** `acceptedRecipeId` by accident.
- The API returns accepted state using the same model:
  - `kind="SUGGESTION"`
  - `status="ACEPTADA"`
  - `acceptedRecipeId="..."`

---

## 6. Trade-offs and future evolution

### Current simplification: one expiration date per ingredient
The current domain model stores one optional expiration date per ingredient.

In real life, multiple lots can exist:
- milk batch A expires 2026-02-05
- milk batch B expires 2026-02-10

Future enhancement:
- model batches/lots as separate entities/value objects
- database would store multiple records per ingredient and household

### Household onboarding simplification
Current onboarding creates a new household per newly registered user and clones demo recipes.

Future enhancements could include:
- creating a household explicitly (name, members)
- inviting other users (join flow)
- separating “global recipe templates” from household recipes

---

## 7. Summary
- Domain model and DB model serve different purposes.
- `Inventory` is an Aggregate Root (behavior + invariants), not necessarily a table.
- `Household` in DB acts as the owner/root for inventory, recipes and suggestions.
- `acceptedRecipeId` is a persistence invariant and must not be lost on upsert.
- Repositories translate between both worlds and keep the domain clean.