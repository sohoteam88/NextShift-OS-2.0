# Implementation Slice 002 - Brand DNA

Version: 1.0

Status: Ready

Capability: CAP-001 Business Profile

Slice: 002

Priority: P0

## Purpose

Implement the second production-ready vertical slice of the Business Profile capability.

This slice captures the business Brand DNA and extends the Business Twin beyond basic identity.

The objective is to establish a canonical brand model that future capabilities can consume without redefining brand information.

## Business Outcome

After completing this slice, an entrepreneur can:

- Define the business brand.
- Describe the brand story.
- Define vision and mission.
- Define brand values.
- Define brand voice.
- Define positioning.

The Business Twin now understands not only who the business is, but how it presents itself.

## Scope

Included:

- Brand Name
- Brand Story
- Vision
- Mission
- Core Values
- Brand Voice
- Positioning

Excluded:

- Logo
- Brand assets
- Design system
- Marketing content
- Customer personas
- Offers
- Goals

## Vertical Slice Architecture

```text
UI
  -> API
  -> Application
  -> Business Brain
  -> Business Twin
  -> Event Bus
```

Every layer participates.

No layer is bypassed.

## Domain Changes

Package:

```text
packages/domain
```

Implement or complete:

- `BrandProfile`
- `BrandVoice`
- `BrandDNA` value object

`BrandDNA` becomes the canonical brand model used across the platform.

## Contract Changes

Package:

```text
packages/contracts
```

Add:

- `UpdateBrandProfileRequest`
- `BrandProfileUpdatedPayload`

Do not import from `@nextshift/domain`.

Use structural payloads.

## Application Changes

Package:

```text
packages/application
```

Implement:

- `UpdateBrandProfileCommand`
- `UpdateBrandProfileUseCase`
- `GetBrandProfileQuery`

Application coordinates Business Brain only.

## Business Brain Changes

Package:

```text
packages/business-brain
```

Extend Business Profile storage to include:

- Brand Name
- Brand Story
- Vision
- Mission
- Values
- Voice
- Positioning

Business Brain updates the Business Twin.

No persistence layer.

## Event Changes

Package:

```text
packages/event-bus
```

Publish:

- `BrandProfileUpdated`

No additional persistence.

## API Changes

Expose:

```text
PATCH /api/v1/business-profile/brand
GET   /api/v1/business-profile/brand
```

Only Brand DNA fields are supported.

## UI Changes

Conversation-first experience.

Suggested flow:

1. Brand Name
2. Brand Story
3. Vision
4. Mission
5. Core Values
6. Brand Voice
7. Positioning
8. AI Brand Summary
9. Confirmation

The AI should explain why each question improves future recommendations.

## Tests

Required:

- Domain tests
- Contract tests
- Application tests
- Business Brain integration tests
- Event publication tests

## Audit

Claude Code should verify:

- `BrandDNA` is canonical.
- No duplicate brand models exist.
- Business Brain remains owner of business understanding.
- Event publication follows specification.
- Runtime boundaries remain intact.

## Acceptance Criteria

Slice-002 is complete when:

- Brand DNA can be created.
- Brand DNA updates the Business Twin.
- `BrandProfileUpdated` event is published.
- API works.
- UI flow works.
- Tests pass.
- Slice Audit passes.
- Chief Architect approves.

## Deliverables

Production-ready implementation for:

- Brand DNA
- Business Twin brand context
- `BrandProfileUpdated` event

## Next Slice

Slice-003: Offer Profile.

The Business Twin begins understanding what the business actually sells.
