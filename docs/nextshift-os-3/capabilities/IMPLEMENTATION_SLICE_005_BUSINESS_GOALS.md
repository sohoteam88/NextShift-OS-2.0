# Implementation Slice 005 - Business Goals

Version: 1.0

Status: Ready

Capability: CAP-001 Business Profile

Slice: 005

Priority: P0

## Purpose

Implement the fifth production-ready vertical slice of the Business Profile capability.

This slice enables the Business Twin to understand the strategic direction of the business.

The objective is to capture business intent rather than operational metrics.

## Business Outcome

After completing this slice, an entrepreneur can define:

- Revenue Goal
- Growth Goal
- Priority Goal
- Current Challenges
- Success Definition

The Business Twin now understands where the business intends to go.

## Scope

Included:

- Revenue Goal
- Growth Goal
- Priority Goal
- Current Challenges
- Success Definition

Excluded:

- KPI dashboards
- Analytics
- Forecasting
- Financial reporting
- Execution planning
- AI recommendations

These belong to future capabilities.

## Vertical Slice Architecture

```text
UI
  -> API
  -> Application
  -> Business Brain
  -> Business Twin
  -> Event Bus
```

No layer may be bypassed.

## Domain Changes

Package:

```text
packages/domain
```

Implement or extend:

```ts
export interface BusinessGoalsProfile {
  readonly revenueGoal?: string;
  readonly growthGoal?: string;
  readonly priorityGoal?: string;
  readonly currentChallenges?: readonly string[];
  readonly successDefinition?: string;
}
```

Update:

```ts
BusinessProfile.goals?: BusinessGoalsProfile;
```

`BusinessGoalsProfile` becomes the canonical strategic goal model.

## Contract Changes

Package:

```text
packages/contracts
```

Add structural payloads:

- `BusinessGoalsProfilePayload`

Requests:

- `UpdateBusinessGoalsRequest`
- `GetBusinessGoalsRequest`

Events:

- `BusinessGoalsUpdatedPayload`

Update:

- `BusinessProfileRecord`
- `BusinessBrainContract`

Do not import `@nextshift/domain`.

## Business Twin Contract

Extend:

```ts
BusinessTwinSnapshot
```

Add:

```ts
goals?: BusinessGoalsContext;
```

`BusinessGoalsContext` includes:

- Revenue Goal
- Growth Goal
- Priority Goal
- Current Challenges
- Success Definition

## Application Changes

Package:

```text
packages/application
```

Implement:

- `UpdateBusinessGoalsCommand`
- `UpdateBusinessGoalsUseCase`
- `GetBusinessGoalsQuery`
- `GetBusinessGoalsUseCase`

Application continues to depend only on `BusinessBrainContract`.

## Business Brain

Package:

```text
packages/business-brain
```

Implement:

- `updateBusinessGoals()`
- `getBusinessGoals()`

Update Business Twin mapping.

Business Brain remains the owner of business understanding.

Do not create Business Profile implicitly.

## Event Bus

Package:

```text
packages/event-bus
```

Publish:

```text
BusinessGoalsUpdated
```

Do not add persistence.

## Tests

Required:

- Domain tests
- Contract tests
- Application tests
- Business Brain integration tests
- Event publication tests

## Audit

Claude Code should verify:

- `BusinessGoalsProfile` is canonical.
- No duplicate goal models exist.
- Business Twin goal mapping is correct.
- Runtime boundaries remain intact.
- No concrete `BusinessBrain` imports.
- No new package dependencies.

## Acceptance Criteria

Slice-005 is complete when:

- Business Goals can be updated.
- Business Goals can be retrieved.
- Business Twin includes Goals Context.
- `BusinessGoalsUpdated` event is publishable.
- Typecheck passes.
- Slice Audit passes.
- Chief Architect approves.

## Deliverables

Production-ready implementation for:

- Business Goals
- Business Twin goals context
- `BusinessGoalsUpdated` event

## Next Slice

Slice-006: AI Business Summary.

The Business Brain synthesizes Identity, Brand, Offer, Customer, and Goals into a unified understanding.
