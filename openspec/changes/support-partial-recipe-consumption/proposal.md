## Why

Accepting a suggestion currently consumes the full recipe even when the household intends to cook a smaller portion. Supporting a half portion gives users useful control over inventory consumption while introducing a focused domain rule without requiring the larger lot or unit-of-measure redesign.

## What Changes

- Allow the caller to accept either a full recipe or half of the selected recipe.
- Keep full-recipe consumption as the default for backward compatibility.
- Scale every recipe ingredient requirement before validating and consuming inventory.
- Persist the accepted portion with the suggestion so accepted-plan reads and idempotent retries describe the original decision.
- Return the accepted recipe and portion in the acceptance result and accepted plan state.
- Reject unsupported portion values before application logic executes.
- Add domain, use-case, contract, persistence, authorization, and basic Web Demo coverage using mandatory TDD.

## Capabilities

### New Capabilities

- `partial-recipe-consumption`: Accepting a meal suggestion for a full or half recipe and consuming the corresponding proportional ingredient quantities.

### Modified Capabilities

None.

## Impact

- Domain: recipe portion modeling and proportional ingredient calculation.
- Application: `AcceptSuggestionUseCase` validation, consumption, and idempotency behavior.
- Contracts and HTTP: accept-suggestion request/response and accepted cooking-plan representation.
- Persistence: accepted portion stored on `MealSuggestion` through a reproducible Prisma migration.
- Web Demo: a small full/half selector in the Plan acceptance flow.
- Documentation: secured HTTP examples and README demo flow if the visible demo steps change.
