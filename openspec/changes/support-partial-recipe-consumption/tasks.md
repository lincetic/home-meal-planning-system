## 1. Domain model

- [x] 1.1 Add failing domain tests for valid `FULL`/`HALF` portions and rejection of unsupported values
- [x] 1.2 Implement the minimum `RecipePortion` value object needed to pass the tests
- [x] 1.3 Add failing Recipe tests for full and half ingredient requirements, including immutability
- [x] 1.4 Implement proportional requirement behavior in Recipe and refactor with domain tests green

## 2. Acceptance application behavior

- [x] 2.1 Add failing `AcceptSuggestionUseCase` tests for half consumption, default full consumption, insufficient half stock, and portion-aware idempotency
- [x] 2.2 Update application DTOs and suggestion repository port to carry the accepted recipe and portion
- [x] 2.3 Implement the minimum portion-aware acceptance orchestration and keep inventory mutation inside the Inventory aggregate

## 3. Contracts and HTTP boundary

- [x] 3.1 Add failing contract and mapper tests for optional `portion`, accepted recipe/portion responses, and invalid portion rejection
- [x] 3.2 Update `@tfm/contracts`, HTTP mapping, and accepted cooking-plan mapping to satisfy the new contracts
- [x] 3.3 Extend authorization route tests for 401, 403, and authorized half-recipe acceptance

## 4. Persistence

- [x] 4.1 Add failing Prisma repository tests for storing and reading accepted portions, including legacy `FULL` fallback
- [x] 4.2 Add a reproducible Prisma migration and schema field for the accepted portion
- [x] 4.3 Implement repository mapping that stores recipe and portion together and passes the persistence tests

## 5. Web Demo

- [x] 5.1 Validate API-client typing for default full selection and sending `HALF` with the Web Demo TypeScript build
- [x] 5.2 Add the full/half selector to the Plan suggestion state and display the persisted portion in the accepted state

## 6. Documentation and verification

- [x] 6.1 Update `docs/http-examples.md` and README demo steps with full and half acceptance examples
- [x] 6.2 Run formatting/lint checks and `pnpm test`, fixing only behavior covered by the change
- [x] 6.3 Verify the seeded demo flow: login, add inventory, accept half recipe, reload `/plan/today`, and observe the accepted half portion and remaining inventory
