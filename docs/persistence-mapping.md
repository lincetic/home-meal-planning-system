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

- there is only one item per `ingredientId`
- quantities cannot be negative
- consuming an ingredient removes the item when quantity reaches zero
- expiring soon items can be queried by business rules

`Inventory` is a behavior-centric object:
- not just data storage
- it encapsulates invariants and operations

### InventoryItem (Entity)
`InventoryItem` represents a specific ingredient inside an inventory, including:
- ingredientId
- quantity (as a Value Object)
- expiration date (optional)

It contains behavior:
- `consume(...)`
- `add(...)`
- `isExpiringSoon(...)`

### Household (concept)
At domain level, a household is the owner of the shared inventory and planning.
Even if not fully implemented yet, the domain assumes:

- each inventory belongs to one household
- multiple households exist in the system

---

## 3. Database model (persistence perspective)

In the database we store **data that can be indexed and queried efficiently**.

### Why there is no `Inventory` table
In the MVP, an inventory is always tied to exactly one household.  
So in persistence:

- `Inventory` is represented by the collection of `InventoryItem` rows belonging to a `Household`.

This avoids an extra table that would provide no additional information in the MVP.

### Tables (Prisma models)

- `Household`
  - root record to own inventory rows (and future members/preferences/suggestions)
- `InventoryItem`
  - rows containing ingredient stock data
  - uniquely constrained by `(householdId, ingredientId)`

This structure is normalized and supports:
- queries by household
- indexes and uniqueness
- future growth (members, suggestions, recipes)

---

## 4. Mapping rules (Repository responsibilities)

A repository in the infrastructure layer performs two translations:

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

## 5. Trade-offs and future evolution

### Current simplification: one expiration date per ingredient
The current domain model stores one optional expiration date per ingredient.

In real life, multiple lots can exist:
- milk batch A expires 2026-02-05
- milk batch B expires 2026-02-10

Future enhancement:
- model batches/lots as separate entities/value objects
- database would store multiple records per ingredient and household

### Why not store inventory as JSON
Storing the inventory as a single JSON blob is possible, but it reduces:
- query capability (expiring items, counts)
- indexing performance
- incremental updates

For a TFM and a scalable design, normalized tables are preferred.

---

## 6. Summary
- Domain model and DB model serve different purposes.
- `Inventory` is an Aggregate Root (behavior + invariants), not necessarily a table.
- `Household` in DB acts as the owner/root for inventory persistence.
- Repositories translate between both worlds and keep the domain clean.
