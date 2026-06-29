# Business Profile Application Specification

Version: 1.0

Status: Draft

Capability ID: CAP-001

Capability Name: Business Profile

## Purpose

This document defines the Application Layer specification for the Business Profile capability.

It translates business use cases into application commands, queries, orchestrators, and runtime interactions.

The Application Layer coordinates the Core Runtime.

It does not own business truth.

It does not implement business logic.

## Architecture Position

```text
User
  -> Application Layer
  -> Business Brain
  -> Business Twin
  -> Event Bus
  -> Learning System
```

Business Profile should always enter the system through the Application Layer.

## Responsibilities

The Application Layer is responsible for:

- Validating application requests.
- Coordinating Business Brain interactions.
- Publishing domain events.
- Returning application responses.
- Orchestrating use cases.

The Application Layer must not:

- Implement Business Brain logic.
- Implement Recommendation logic.
- Implement database persistence.
- Implement UI behavior.

## Commands

The following commands are defined.

### CreateBusinessProfileCommand

Purpose:

Create the first Business Profile.

Primary Output:

`BusinessProfileCreated` event.

### UpdateBusinessProfileCommand

Purpose:

Update an existing Business Profile.

Primary Output:

`BusinessProfileUpdated` event.

### CompleteBusinessProfileCommand

Purpose:

Complete missing profile information.

Primary Output:

`BusinessProfileCompletenessChanged` event.

### ReviewBusinessIdentityCommand

Purpose:

Request Business Brain to summarize current business identity.

Primary Output:

`BusinessIdentityReviewCompleted` event.

## Queries

### GetBusinessProfileQuery

Purpose:

Retrieve the current Business Profile.

### GetBusinessProfileCompletenessQuery

Purpose:

Retrieve profile completeness information.

### GetBusinessIdentitySummaryQuery

Purpose:

Retrieve the AI-generated summary of the business identity.

## Application Use Cases

Each application use case corresponds to a business use case.

| Business Use Case | Application Use Case |
| --- | --- |
| UC-001 Create Business Profile | CreateBusinessProfileUseCase |
| UC-002 Update Business Profile | UpdateBusinessProfileUseCase |
| UC-003 AI Guided Completion | CompleteBusinessProfileUseCase |
| UC-004 Business Identity Review | ReviewBusinessIdentityUseCase |
| UC-005 Brand Identity Refinement | UpdateBrandProfileUseCase |
| UC-006 Business Goal Alignment | UpdateBusinessGoalsUseCase |

## Orchestrators

The Application Layer orchestrates the following flows.

### CreateBusinessProfileOrchestrator

Flow:

1. Validate command.
2. Invoke Business Brain.
3. Initialize Business Twin.
4. Publish `BusinessProfileCreated`.
5. Return response.

### UpdateBusinessProfileOrchestrator

Flow:

1. Validate changes.
2. Update Business Brain.
3. Publish `BusinessProfileUpdated`.
4. Trigger Learning System notification.

### ReviewBusinessIdentityOrchestrator

Flow:

1. Request Business Brain summary.
2. Generate AI explanation.
3. Return application response.

## Runtime Dependencies

Application Layer uses:

- `@nextshift/business-brain`
- `@nextshift/contracts`
- `@nextshift/event-bus`

It must not bypass the Core Runtime.

## Produced Events

Application Layer may publish:

- `BusinessProfileCreated`
- `BusinessProfileUpdated`
- `BusinessIdentityUpdated`
- `BrandProfileUpdated`
- `CustomerProfileUpdated`
- `BusinessGoalsUpdated`
- `BusinessProfileCompletenessChanged`

Event payloads are defined in [Business Profile Events](BUSINESS_PROFILE_EVENTS.md).

## Consumed Events

Application Layer may consume:

- `BusinessCreated`
- `BusinessImported`
- `BusinessProfileCorrectionAccepted`

## Error Handling

Application errors should be expressed using canonical runtime error types.

Examples:

- `ValidationError`
- `DomainError`
- `ConfigurationError`

Application implementations should not introduce custom error formats.

## Transaction Boundary

Each command should execute within one application transaction.

The transaction ends when:

- Business Brain update succeeds.
- Domain events are published.
- Application response is returned.

## Security

The Application Layer should verify:

- Tenant context
- Actor context
- Authorization

before invoking Business Brain.

## Observability

Every command should emit:

- `CorrelationId`
- `CausationId`
- `Timestamp`
- `BusinessId`

These values enable end-to-end traceability across the runtime.

## Out Of Scope

This document does not define:

- REST API
- GraphQL
- gRPC
- UI workflow
- Database schema
- Persistence
- Infrastructure

Those are defined separately.

## API Specification

The public API surface for these application use cases is defined in [Business Profile API Specification](BUSINESS_PROFILE_API_SPEC.md).

## Success Criteria

The Application Specification succeeds when:

- Every business use case maps to an application use case.
- Runtime interactions remain consistent.
- Business Brain remains the owner of business understanding.
- Event publication remains deterministic.
- API implementations can be built without redefining business behavior.

## Guiding Principle

The Application Layer coordinates business behavior.

It never owns business intelligence.
