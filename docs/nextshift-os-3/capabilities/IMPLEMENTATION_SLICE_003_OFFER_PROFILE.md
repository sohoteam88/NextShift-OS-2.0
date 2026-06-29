# Implementation Slice 003 - Offer Profile

Version: 1.0

Status: Ready

Capability: CAP-001 Business Profile

Slice: 003

Priority: P0

## Purpose

Implement the third production-ready vertical slice of the Business Profile capability.

This slice enables the Business Twin to understand what value the business delivers through its products, services, and value proposition.

## Business Outcome

After completing this slice, an entrepreneur can:

- Define products.
- Define services.
- Define the core offer.
- Define the value proposition.

The Business Twin now understands what the business provides to customers.

## Scope

Included:

- Core Offer
- Products
- Services
- Value Proposition

Excluded:

- Pricing
- Inventory
- CRM
- Campaigns
- Content generation
- Revenue tracking

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

Extend the Business Profile model.

Implement:

- `OfferProfile`
- `ProductProfile`
- `ServiceProfile`

Update:

```ts
BusinessProfile.offer?: OfferProfile;
```

`OfferProfile` becomes the canonical offer model.

## Contract Changes

Package:

```text
packages/contracts
```

Add structural payloads:

- `ProductProfilePayload`
- `ServiceProfilePayload`
- `OfferProfilePayload`

Requests:

- `UpdateOfferProfileRequest`
- `GetOfferProfileRequest`

Event payload:

- `OfferProfileUpdatedPayload`

Update:

- `BusinessProfileRecord`
- `BusinessBrainContract`

Do not import from `@nextshift/domain`.

## Business Twin Contract

Extend:

```ts
BusinessTwinSnapshot
```

Add:

```ts
offer?: OfferContext;
```

`OfferContext` includes:

- Core Offer
- Products
- Services
- Value Proposition

## Application Changes

Package:

```text
packages/application
```

Implement:

- `UpdateOfferProfileCommand`
- `UpdateOfferProfileUseCase`
- `GetOfferProfileQuery`
- `GetOfferProfileUseCase`

Application must continue depending only on `BusinessBrainContract`.

## Business Brain

Package:

```text
packages/business-brain
```

Implement:

- `updateOfferProfile()`
- `getOfferProfile()`

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
OfferProfileUpdated
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

- `OfferProfile` is canonical.
- No duplicate offer models exist.
- Business Twin mapping is correct.
- Runtime boundaries remain intact.
- No concrete `BusinessBrain` imports.
- No new package dependencies.

## Acceptance Criteria

Slice-003 is complete when:

- Offer Profile can be updated.
- Offer Profile can be retrieved.
- Business Twin includes Offer Context.
- `OfferProfileUpdated` event is publishable.
- Typecheck passes.
- Slice Audit passes.
- Chief Architect approves.

## Deliverables

Production-ready implementation for:

- Offer Profile
- Business Twin offer context
- `OfferProfileUpdated` event

## Next Slice

Slice-004: Customer Profile.

The Business Twin begins understanding who the business serves.
