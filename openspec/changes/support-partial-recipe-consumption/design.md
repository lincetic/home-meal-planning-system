## Context

`AcceptSuggestionUseCase` currently loads the selected `Recipe`, verifies that the household inventory contains each fixed `RecipeIngredient.amount`, consumes those exact amounts through the `Inventory` aggregate, saves the inventory, and marks the suggestion as accepted.

The inventory already supports subtracting less than the available quantity, but the acceptance input cannot express that the household cooked less than one complete recipe. `Quantity` is unitless and recipes do not model servings, so a general serving system would introduce semantics the current model cannot honestly support.

This change crosses contracts, domain, application, persistence, HTTP mapping, and the Web Demo. Household membership remains the authorization boundary.

## Goals / Non-Goals

**Goals:**

- Let a user accept a suggested recipe as `FULL` or `HALF`.
- Keep existing clients working by treating an omitted portion as `FULL`.
- Put proportional ingredient calculation in the domain rather than controllers or persistence.
- Persist the accepted portion so accepted-plan reads and retries remain consistent.
- Exercise Clean Architecture with a rule that flows through every layer.
- Keep the implementation achievable with small TDD increments.

**Non-Goals:**

- Arbitrary serving counts or free-form multipliers.
- Cooking more than one complete recipe.
- Units of measure or conversions.
- Inventory lots, multiple expiration dates, or FIFO consumption.
- Redesigning inventory persistence or making inventory and suggestion writes one database transaction.
- Recording a general inventory-consumption ledger.

## Decisions

### Model the choice as a domain value object

Introduce a `RecipePortion` value object with exactly `FULL` and `HALF`. It exposes the multiplier needed for calculation but prevents application and interface layers from passing arbitrary numeric factors into domain behavior.

This is preferred over adding a raw `number` to `AcceptSuggestionUseCase`, because the raw number would allow unsupported values and spread validation rules across layers. It is also preferred over adding recipe servings now, because recipes have no trustworthy base-serving data.

### Ask Recipe for proportional requirements

`Recipe` will expose behavior that returns ingredient requirements for a `RecipePortion`. Full portions retain existing quantities; half portions return new `Quantity` values scaled by `0.5`. Recipe ingredient state remains immutable from the caller's perspective.

`AcceptSuggestionUseCase` will use the returned requirements for both the availability check and consumption. Controllers only map the validated contract value to the application input.

### Preserve backward compatibility

The accept-suggestion request will add optional `portion`, constrained by the contract to `FULL | HALF`. The application defaults an omitted value to `FULL`.

The response will include `acceptedRecipeId` and `acceptedPortion`. The accepted cooking-plan state will expose the same decision. Existing status and suggestion identifiers remain unchanged.

### Persist the acceptance decision

Add an accepted-portion field to `MealSuggestion`. New acceptances always store it. Existing accepted records created before the migration are interpreted as `FULL`; the migration should backfill them or the repository mapper should provide the same fallback during rollout.

The suggestion repository port will express storing the accepted recipe and portion together, avoiding a repository API that can persist only half of the acceptance decision.

### Keep authorization behavior unchanged

The endpoint continues to derive the household from the persisted suggestion and relies on the existing membership guard. Portion selection does not weaken household isolation. Existing 401 and 403 behavior must remain covered.

### Use TDD by architectural slice

Implementation starts with failing tests for `RecipePortion` and proportional recipe requirements, followed by `AcceptSuggestionUseCase`, contracts/mappers, Prisma persistence, authorization, and finally the Web Demo. Production code is added only after the corresponding red test exists.

## Risks / Trade-offs

- **`HALF` is less flexible than arbitrary servings** → Keep the language explicitly about recipe portions and defer serving counts until recipes model a base yield.
- **Floating-point quantities can produce precision artifacts** → Limit this change to multiplication by `0.5` and use domain equality expectations appropriate to the stored values; decimal/measurement redesign remains separate.
- **Legacy accepted suggestions have no stored portion** → Treat them as `FULL` and verify the migration/fallback with a repository test.
- **Acceptance still spans multiple persistence operations** → Preserve current behavior for scope control and document transactionality as a later reliability change.
- **The UI could imply real-world units that do not exist** → Label the choice “Receta completa” and “Media receta”, never grams, liters, or servings.

## Migration Plan

1. Add the nullable/defaulted accepted-portion column through a reproducible Prisma migration.
2. Backfill existing accepted suggestions as `FULL`.
3. Deploy repository and application code that reads the persisted value and defaults legacy nulls to `FULL`.
4. Deploy the additive contract and Web Demo selector.
5. Rollback can remove UI usage first; application defaults ensure older requests continue to consume a full recipe.

## Open Questions

None for this scoped MVP. Arbitrary servings, units, lots, and transactional acceptance should be evaluated as separate changes.
