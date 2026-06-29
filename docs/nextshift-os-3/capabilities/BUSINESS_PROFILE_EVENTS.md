# Business Profile Events

Version: 1.0

Status: Draft

Capability ID: CAP-001

Capability Name: Business Profile

## Purpose

This document defines the domain events produced and consumed by the Business Profile capability.

Business Profile is the first capability that contributes real business knowledge to the Business Twin.

Domain events communicate meaningful business facts.

They do not represent commands or implementation details.

## Event Philosophy

Events describe what has already happened.

They are immutable.

They should be meaningful to the business.

Every event should answer:

**What business fact just became true?**

## Event Naming Convention

Events use the following format:

```text
<Noun><PastTenseVerb>
```

Examples:

- `BusinessProfileCreated`
- `BrandProfileUpdated`
- `BusinessGoalsUpdated`

Avoid imperative names:

- `CreateBusinessProfile`
- `UpdateBrand`
- `SaveGoals`

## Event Categories

Business Profile publishes:

- Lifecycle Events
- Identity Events
- Brand Events
- Offer Events
- Customer Events
- Goal Events
- Quality Events

## Lifecycle Events

### BusinessProfileCreated

Meaning:

A Business Profile has been created for a business.

Producer:

Business Profile

Consumers:

- Business Brain
- Learning System
- Analytics
- Audit Log

Payload:

```ts
{
  businessId: BusinessId;
  profileVersion: number;
  createdAt: Timestamp;
}
```

### BusinessProfileUpdated

Meaning:

The Business Profile has changed.

Producer:

Business Profile

Consumers:

- Business Brain
- Learning System

Payload:

```ts
{
  businessId: BusinessId;
  changedSections: readonly string[];
  updatedAt: Timestamp;
}
```

## Identity Events

### BusinessIdentityUpdated

Meaning:

The identity of the business has changed.

Examples:

- Business name
- Industry
- Business stage
- Country

Consumers:

- Business Brain
- Recommendation Engine
- Analytics

## Brand Events

### BrandProfileUpdated

Meaning:

Brand identity has changed.

Examples:

- Vision
- Mission
- Positioning
- Brand Voice

Consumers:

- Business Brain
- Content Capability
- AI Coach

## Offer Events

### OfferProfileUpdated

Meaning:

Products, services, or value proposition changed.

Consumers:

- CRM
- Campaign
- Recommendation Engine

## Customer Events

### CustomerProfileUpdated

Meaning:

Customer understanding has changed.

Examples:

- Persona
- Problems
- Desired outcomes

Consumers:

- CRM
- Campaign
- AI Coach

## Goal Events

### BusinessGoalsUpdated

Meaning:

Business objectives changed.

Examples:

- Revenue goal
- Growth goal
- Priority goal

Consumers:

- Decision Brain
- Strategy Engine
- AI Coach

## Quality Events

### BusinessProfileCompletenessChanged

Meaning:

The completeness score changed.

Consumers:

- AI Business Partner
- Business Brain

Example:

```text
Completeness: 65% -> 82%
```

## Consumed Events

Business Profile consumes the following events.

### BusinessCreated

Purpose:

Initialize the first Business Profile.

### BusinessImported

Purpose:

Create a profile from imported data.

### BusinessProfileCorrectionAccepted

Purpose:

Apply user-confirmed corrections.

## Event Flow

```text
User
  -> Business Profile
  -> BusinessProfileUpdated
  -> Event Bus
  -> Business Brain
  -> Business Twin Updated
  -> Learning System
  -> Business Memory Updated
```

Business Profile never updates downstream systems directly.

Everything flows through the Event Bus.

## Event Rules

Every event must:

- Represent a completed business fact.
- Be immutable.
- Include business identity.
- Include timestamp.
- Be traceable.

Events must never contain implementation details.

## Event Metadata

Every Business Profile event should include:

- `EventId`
- `BusinessId`
- `TenantId`
- `CorrelationId`
- `CausationId`
- `Timestamp`
- `EventVersion`

These fields come from `@nextshift/shared` and `@nextshift/contracts`.

## Runtime Dependencies

Business Profile events depend on:

- `@nextshift/event-bus`
- `@nextshift/contracts`
- `@nextshift/shared`

They do not depend on implementation packages.

## Success Criteria

Business Profile events succeed when:

- Business facts are observable.
- Downstream systems remain loosely coupled.
- Business Brain stays synchronized.
- Learning System receives meaningful signals.
- Future capabilities integrate without direct coupling.

## Out Of Scope

This document does not define:

- Event persistence
- Message broker implementation
- Retry policies
- Infrastructure transports

These belong to the Event Bus implementation.

## Guiding Principle

Business facts should travel through events.

Systems should collaborate through facts, not direct dependencies.
