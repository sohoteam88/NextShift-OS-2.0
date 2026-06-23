# COO-001B State Validation Engine PRD

Status: Approved baseline
Owner: NextShift OS
Scope: State validation, explainability, traceability

## Objective

Ensure the AI COO can validate the current user state before selecting a mission. The current sprint hardens the existing projection path; it does not introduce a new Bottleneck Engine or Priority Engine.

## Inputs

- Authenticated user id
- Tenant id
- Business state projection
- Journey projection
- Mission authority snapshot
- AI COO plan
- Growth loop and value projections

## Output Contract

The validation path must produce:

- `currentState`
- `completedStates`
- `missingRequirements`
- `currentGap`
- `mission`
- `reasoning`
- `expectedOutcome`
- `route`
- `completionStatus`

## Explainability Rules

1. Explainability is generated in the Mission Engine / projection layer.
2. Dashboard components display explainability but do not rewrite it.
3. Internal diagnostic strings are normalized before they reach user-facing dashboard fields.
4. The raw mission authority reasoning remains available for debugging.

## Traceability Rules

Every dashboard mission decision should be auditable with:

- Timestamp
- User id
- Tenant id
- Current state
- Bottleneck/current gap
- Mission id and title
- Reasoning
- Route
- Completion status

Existing `AuditLog` can store this metadata using action `mission.decision.projected`.

## Failure Behavior

If the projection path cannot validate state:

- Dashboard shows a Mission Engine failure state.
- It does not fabricate a mission.
- It offers a safe route to `/journey`.

## Acceptance Criteria

- Dashboard projection is the only interface consumed by dashboard UI.
- Mission decisions are traceable through audit metadata.
- Route targets match the production route contract.
- Build and type-check pass.
