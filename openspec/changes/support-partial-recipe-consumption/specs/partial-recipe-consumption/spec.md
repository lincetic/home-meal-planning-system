## ADDED Requirements

### Requirement: Supported recipe portions
The system SHALL represent an accepted recipe portion as either `FULL` or `HALF`, and SHALL reject any other portion value.

#### Scenario: Full portion is valid
- **WHEN** a caller requests the `FULL` portion
- **THEN** the system accepts the portion as a valid domain value

#### Scenario: Half portion is valid
- **WHEN** a caller requests the `HALF` portion
- **THEN** the system accepts the portion as a valid domain value

#### Scenario: Unsupported portion is rejected
- **WHEN** a caller submits a portion other than `FULL` or `HALF`
- **THEN** request validation fails before suggestion acceptance is executed

### Requirement: Proportional recipe requirements
The Recipe domain model SHALL calculate ingredient requirements from the selected recipe portion without mutating the recipe's original ingredient quantities.

#### Scenario: Full recipe requirements
- **WHEN** a recipe requiring 2 units of an ingredient is calculated for `FULL`
- **THEN** the resulting requirement is 2 units

#### Scenario: Half recipe requirements
- **WHEN** a recipe requiring 2 units of an ingredient is calculated for `HALF`
- **THEN** the resulting requirement is 1 unit

#### Scenario: Original recipe remains unchanged
- **WHEN** half-recipe requirements are calculated
- **THEN** subsequent full-recipe requirements still contain the original quantities

### Requirement: Accept suggestion with selected portion
The system SHALL validate and consume inventory using the ingredient requirements for the selected portion of the selected suggested recipe.

#### Scenario: Accept half recipe with sufficient inventory
- **WHEN** a suggested recipe requires 2 units, the household has 1 unit, and the user accepts `HALF`
- **THEN** the system accepts the suggestion and consumes 1 unit

#### Scenario: Reject full recipe when only half is available
- **WHEN** a suggested recipe requires 2 units, the household has 1 unit, and the user accepts `FULL`
- **THEN** the system rejects acceptance without saving an inventory change

#### Scenario: Reject half recipe when inventory is still insufficient
- **WHEN** a suggested recipe requires 2 units, the household has less than 1 unit, and the user accepts `HALF`
- **THEN** the system rejects acceptance without saving an inventory change

#### Scenario: Omitted portion defaults to full
- **WHEN** a valid suggestion acceptance omits the portion
- **THEN** the system consumes the full recipe requirements

### Requirement: Accepted portion is durable
The system SHALL persist the accepted recipe identifier and accepted portion as part of the suggestion's accepted decision.

#### Scenario: Persist half-recipe acceptance
- **WHEN** a suggestion is successfully accepted as `HALF`
- **THEN** later reads of the accepted plan report the selected recipe and `HALF`

#### Scenario: Legacy accepted suggestion
- **WHEN** an accepted suggestion created before portion persistence is read
- **THEN** the system reports its accepted portion as `FULL`

### Requirement: Portion-aware idempotency
The system SHALL NOT consume inventory again when an already accepted suggestion is retried, and SHALL return the originally persisted acceptance decision.

#### Scenario: Retry accepted half recipe
- **WHEN** a suggestion previously accepted as `HALF` is accepted again
- **THEN** inventory remains unchanged and the response reports the original recipe and `HALF`

#### Scenario: Retry supplies a different portion
- **WHEN** a suggestion previously accepted as `HALF` is retried with `FULL`
- **THEN** inventory remains unchanged and the response still reports the original `HALF` decision

### Requirement: Household authorization remains enforced
The portion-aware acceptance endpoint SHALL preserve the existing household authentication and membership rules.

#### Scenario: Unauthenticated acceptance
- **WHEN** a caller accepts a portion without a valid JWT
- **THEN** the endpoint returns 401

#### Scenario: Non-member acceptance
- **WHEN** an authenticated user accepts a portion for a suggestion belonging to another household
- **THEN** the endpoint returns 403 and inventory remains unchanged

#### Scenario: Household member acceptance
- **WHEN** an authenticated household member accepts a valid portion with sufficient inventory
- **THEN** the endpoint returns 200 with the accepted recipe and portion

### Requirement: Web Demo portion choice
The Plan tab SHALL let the user choose between a full recipe and half recipe before accepting a suggestion, with full recipe selected by default.

#### Scenario: Default Plan selection
- **WHEN** a cookable suggestion is displayed
- **THEN** “Receta completa” is selected by default

#### Scenario: Accept half recipe from Plan
- **WHEN** the user selects “Media receta” and accepts a suggested recipe
- **THEN** the Web Demo sends `HALF` and displays the accepted recipe as a half recipe
