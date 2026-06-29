# Implementation Slice 001 - Business Identity

Version: 1.0

Status: Ready

Capability: CAP-001 Business Profile

Slice: 001

Priority: P0

## Purpose

Implement the first production-ready vertical slice of the Business Profile capability.

This slice delivers the minimum business identity required to initialize the Business Twin.

The objective is not feature completeness.

The objective is delivering the first end-to-end business value.

## Business Outcome

After completing this slice, an entrepreneur can:

- Create a Business Profile.
- Save core business identity.
- Initialize the Business Twin.
- Receive confirmation that the AI understands the business identity.

This is the first usable capability of NextShift OS.

## Scope

Included fields:

- Business Name
- Industry
- Business Stage
- Country
- Time Zone

Excluded:

- Brand
- Products
- Services
- Customer Personas
- Goals
- AI Summary

Those belong to later slices.

## Vertical Slice Architecture

```text
UI
  -> API
  -> Application
  -> Business Brain
  -> Business Twin
  -> Event Bus
```

Every layer must participate.

No layer may be skipped.

## Domain Changes

Package:

```text
packages/domain
```

Implement:

- `BusinessProfile`
- `BusinessIdentity`
- `BusinessStage`

No persistence.

## Application Changes

Package:

```text
packages/application
```

Implement:

- `CreateBusinessProfileCommand`
- `CreateBusinessProfileUseCase`
- `GetBusinessProfileQuery`

The Application Layer coordinates the workflow.

## Business Brain Changes

Package:

```text
packages/business-brain
```

Implement:

- Initialize Business Twin
- Store Business Identity
- Retrieve Business Identity

Business Brain remains the owner of business understanding.

## Event Changes

Package:

```text
packages/event-bus
```

Publish:

- `BusinessProfileCreated`

No additional events in this slice.

## API Changes

Expose:

```text
POST /api/v1/business-profile
GET  /api/v1/business-profile
```

Only Business Identity fields are supported.

## UI Changes

Create the onboarding experience for:

1. Welcome
2. Business Name
3. Industry
4. Business Stage
5. Country
6. Time Zone
7. Review
8. Finish

The UI should feel conversational rather than form-based.

## Tests

Required:

- Domain tests
- Application tests
- Business Brain integration tests
- API tests
- Event publication tests

## Audit

Claude Code should verify:

- Runtime boundaries respected
- Domain purity maintained
- Events published correctly
- Business Brain owns Business Twin
- No direct database access
- No runtime bypass

## Acceptance Criteria

Slice-001 is complete when:

- Business Identity can be created.
- Business Twin is initialized.
- `BusinessProfileCreated` event is emitted.
- API works.
- UI flow works.
- Tests pass.
- Claude Code audit passes.
- Chief Architect review approves.

## Deliverables

Production-ready implementation for:

- Business Identity
- Business Twin initialization
- `BusinessProfileCreated` event

## Next Slice

Slice-002: Brand Identity.

The Business Twin will begin understanding the business brand.
