# Business Profile Domain Model

Version: 1.0

Status: Draft

Capability ID: CAP-001

Capability Name: Business Profile

## Purpose

This document defines the domain model for the Business Profile capability.

Business Profile provides the foundational business identity data required to initialize and strengthen the Business Twin.

This document defines business concepts only.

It does not define database tables, API payloads, UI screens, or implementation details.

## Mission

The mission of the Business Profile Domain Model is to provide one canonical representation of a business identity.

Every future system should use this model when referring to a business profile.

## Domain Principle

Business Profile is not a profile page.

Business Profile is the identity layer of the Business Twin.

It describes who the business is, what it offers, who it serves, and what it is trying to achieve.

## Core Aggregate

### BusinessProfile

`BusinessProfile` is the root aggregate of CAP-001.

It represents the structured identity of a business.

```ts
export interface BusinessProfile {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly identity: BusinessIdentity;
  readonly brand?: BrandProfile;
  readonly offer?: OfferProfile;
  readonly customer?: CustomerProfile;
  readonly goals?: BusinessGoalProfile;
  readonly metadata: BusinessProfileMetadata;
}
```

## Entity: BusinessIdentity

`BusinessIdentity` defines the basic identity of the business.

```ts
export interface BusinessIdentity {
  readonly businessName: string;
  readonly legalName?: string;
  readonly industry?: string;
  readonly businessStage?: BusinessStage;
  readonly country?: string;
  readonly timeZone?: string;
}
```

## Value Object: BusinessStage

```ts
export type BusinessStage =
  | "idea"
  | "startup"
  | "early_growth"
  | "growth"
  | "scale"
  | "mature";
```

## Entity: BrandProfile

`BrandProfile` defines the brand identity of the business.

```ts
export interface BrandProfile {
  readonly brandName?: string;
  readonly brandStory?: string;
  readonly vision?: string;
  readonly mission?: string;
  readonly values?: readonly string[];
  readonly voice?: BrandVoice;
  readonly positioning?: string;
}
```

## Value Object: BrandVoice

```ts
export type BrandVoice =
  | "professional"
  | "friendly"
  | "premium"
  | "bold"
  | "educational"
  | "inspirational"
  | "casual";
```

## Entity: OfferProfile

`OfferProfile` defines what the business sells or provides.

```ts
export interface OfferProfile {
  readonly coreOffer?: string;
  readonly products?: readonly ProductProfile[];
  readonly services?: readonly ServiceProfile[];
  readonly valueProposition?: string;
}
```

## Entity: ProductProfile

```ts
export interface ProductProfile {
  readonly productId?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
}
```

## Entity: ServiceProfile

```ts
export interface ServiceProfile {
  readonly serviceId?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
}
```

## Entity: CustomerProfile

`CustomerProfile` defines who the business serves.

```ts
export interface CustomerProfile {
  readonly targetCustomer?: string;
  readonly personas?: readonly CustomerPersonaProfile[];
  readonly problems?: readonly string[];
  readonly desiredOutcomes?: readonly string[];
}
```

## Entity: CustomerPersonaProfile

```ts
export interface CustomerPersonaProfile {
  readonly personaId?: string;
  readonly name: string;
  readonly description?: string;
  readonly painPoints?: readonly string[];
  readonly goals?: readonly string[];
}
```

## Entity: BusinessGoalProfile

`BusinessGoalProfile` defines what the business is trying to achieve.

```ts
export interface BusinessGoalProfile {
  readonly revenueGoal?: string;
  readonly growthGoal?: string;
  readonly priorityGoal?: string;
  readonly currentChallenges?: readonly string[];
}
```

## Entity: BusinessProfileMetadata

```ts
export interface BusinessProfileMetadata {
  readonly createdAt: Timestamp;
  readonly updatedAt?: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
  readonly completenessScore?: number;
}
```

## Completeness Rules

A Business Profile is considered minimally complete when it includes:

- `businessName`
- `industry`
- `country`
- `coreOffer` or at least one product or service
- `targetCustomer`
- `priorityGoal` or `currentChallenges`

## Business Twin Mapping

Business Profile maps into the Business Twin as follows:

| Business Profile Field | Business Twin Area |
| --- | --- |
| BusinessIdentity | Business Identity Context |
| BrandProfile | Brand DNA |
| OfferProfile | Business Offering Context |
| CustomerProfile | Customer Understanding |
| BusinessGoalProfile | Strategy Context |
| BusinessProfileMetadata | Business Memory Metadata |

## Domain Events

Business Profile may produce the following domain events:

- `BusinessProfileCreated`
- `BusinessProfileUpdated`
- `BusinessIdentityUpdated`
- `BrandProfileUpdated`
- `OfferProfileUpdated`
- `CustomerProfileUpdated`
- `BusinessGoalsUpdated`
- `BusinessProfileCompletenessChanged`

Event schemas are defined separately in [Business Profile Events](BUSINESS_PROFILE_EVENTS.md).

## Validation Rules

Validation rules should remain domain-oriented.

Examples:

- `businessName` must not be empty.
- `completenessScore` must be between 0 and 100.
- Products and services may be empty, but at least one offering should exist for a complete profile.
- Customer problems should describe business-relevant problems.
- Goals should be business-oriented.

## Out Of Scope

This document does not define:

- Database schema
- API endpoints
- UI forms
- Persistence logic
- Recommendation logic
- CRM data
- Campaign data

## Runtime Dependencies

The Business Profile domain model depends conceptually on:

- `@nextshift/domain`
- `@nextshift/shared`

It should not depend directly on:

- `@nextshift/business-brain`
- `@nextshift/decision-brain`
- `@nextshift/execution-layer`
- `@nextshift/learning-system`
- `@nextshift/agents`
- `@nextshift/capability-layer`

## Implementation Guidance

When implemented, these types should either:

- extend `@nextshift/domain` business-related models, or
- be added to `@nextshift/domain` under a business-profile-specific module if they become canonical domain concepts.

Do not duplicate these definitions across API, UI, or database layers.

## Success Criteria

This domain model succeeds when:

- Business Profile has one canonical data shape.
- Business Twin initialization can use this model.
- API, UI, and implementation reference the same concepts.
- Future capabilities can consume Business Profile without redefining business identity.

## Guiding Principle

Define the business before optimizing the business.
