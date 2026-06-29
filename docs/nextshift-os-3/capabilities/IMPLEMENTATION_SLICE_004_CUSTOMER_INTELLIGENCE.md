# Implementation Slice 004 - Customer Intelligence

Version: 1.0

Status: Ready

Capability: CAP-001 Business Profile

Slice: 004

Priority: P0

## Purpose

Implement the fourth production-ready vertical slice of the Business Profile capability.

This slice enables the Business Twin to understand the people the business serves.

The focus is customer understanding rather than customer records.

## Business Outcome

After completing this slice, an entrepreneur can define:

- Target Customer
- Customer Personas
- Customer Problems
- Desired Outcomes

The Business Twin now understands who the business exists to help.

## Scope

Included:

- Target Customer
- Customer Personas
- Customer Problems
- Desired Outcomes

Excluded:

- CRM contacts
- Leads
- Opportunities
- Pipelines
- Sales activities
- Messaging history

These belong to future CRM capabilities.

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

- `CustomerProfile`
- `CustomerPersonaProfile`

Update:

```ts
BusinessProfile.customer?: CustomerProfile;
```

`CustomerProfile` becomes the canonical customer understanding model.

## Contract Changes

Package:

```text
packages/contracts
```

Add structural payloads:

- `CustomerPersonaPayload`
- `CustomerProfilePayload`

Requests:

- `UpdateCustomerProfileRequest`
- `GetCustomerProfileRequest`

Events:

- `CustomerProfileUpdatedPayload`

Do not import `@nextshift/domain`.

## Business Twin Contract

Extend:

```ts
BusinessTwinSnapshot
```

Add:

```ts
customer?: CustomerContext;
```

`CustomerContext` includes:

- Target Customer
- Personas
- Customer Problems
- Desired Outcomes

## Application Changes

Package:

```text
packages/application
```

Implement:

- `UpdateCustomerProfileCommand`
- `UpdateCustomerProfileUseCase`
- `GetCustomerProfileQuery`
- `GetCustomerProfileUseCase`

Application must continue depending only on `BusinessBrainContract`.

## Business Brain

Package:

```text
packages/business-brain
```

Implement:

- `updateCustomerProfile()`
- `getCustomerProfile()`

Update Business Twin mapping.

Business Brain remains the owner of customer understanding.

Do not create Business Profile implicitly.

## Event Bus

Package:

```text
packages/event-bus
```

Publish:

```text
CustomerProfileUpdated
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

- `CustomerProfile` is canonical.
- No duplicate customer models exist.
- Business Twin customer mapping is correct.
- Runtime boundaries remain intact.
- No concrete `BusinessBrain` imports.
- No new package dependencies.

## Acceptance Criteria

Slice-004 is complete when:

- Customer understanding can be updated.
- Customer understanding can be retrieved.
- Business Twin includes Customer Context.
- `CustomerProfileUpdated` event is publishable.
- Typecheck passes.
- Slice Audit passes.
- Chief Architect approves.

## Deliverables

Production-ready implementation for:

- Customer Intelligence
- Business Twin customer context
- `CustomerProfileUpdated` event

## Next Slice

Slice-005: Business Goals.

The Business Twin begins understanding where the business intends to go.
