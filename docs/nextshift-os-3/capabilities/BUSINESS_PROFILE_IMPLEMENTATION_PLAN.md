# Business Profile Implementation Plan

Version: 1.0

Status: Draft

Capability ID: CAP-001

Capability Name: Business Profile

## Purpose

This document defines the engineering implementation plan for the Business Profile capability.

The implementation follows the approved Blueprint, Core Runtime, Domain Model, Application Specification, and API Specification.

Business Profile is the first production capability built on the NextShift Core Runtime.

## Implementation Philosophy

Implement from the inside out.

Follow the architecture.

Never bypass the Core Runtime.

Every implementation should strengthen the Business Twin.

## Runtime Dependencies

Business Profile depends on:

- `@nextshift/domain`
- `@nextshift/shared`
- `@nextshift/contracts`
- `@nextshift/business-brain`
- `@nextshift/application`
- `@nextshift/event-bus`

Business Profile must not bypass these runtime packages.

## Implementation Sequence

Implementation proceeds in phases.

## Phase 1 - Domain

Objective:

Implement Business Profile domain types.

Tasks:

- Finalize Business Profile domain models.
- Add branded identifiers where required.
- Validate domain invariants.

Deliverable:

Stable domain model.

## Phase 2 - Contracts

Objective:

Extend contracts if required.

Tasks:

- Review `BusinessBrainContract`.
- Introduce capability-specific contracts only if necessary.

Deliverable:

Contract-complete capability.

## Phase 3 - Application

Objective:

Implement application use cases.

Tasks:

- `CreateBusinessProfileUseCase`
- `UpdateBusinessProfileUseCase`
- `ReviewBusinessIdentityUseCase`
- `CompleteBusinessProfileUseCase`

Deliverable:

Application orchestration.

## Phase 4 - Business Brain Integration

Objective:

Connect Business Profile to the Business Brain.

Tasks:

- Initialize Business Twin.
- Update Business Twin.
- Retrieve Business Summary.

Deliverable:

Business Brain integration.

## Phase 5 - Events

Objective:

Publish Business Profile events.

Tasks:

- `BusinessProfileCreated`
- `BusinessProfileUpdated`
- `BusinessIdentityUpdated`
- `BrandProfileUpdated`
- `CustomerProfileUpdated`
- `BusinessGoalsUpdated`
- `BusinessProfileCompletenessChanged`

Deliverable:

Event-driven integration.

## Phase 6 - API

Objective:

Expose application use cases.

Tasks:

- Create endpoints.
- Input validation.
- Error handling.
- Authorization.

Deliverable:

Public API.

## Phase 7 - User Experience

Objective:

Implement the onboarding experience.

Tasks:

- Welcome
- AI Interview
- Brand Discovery
- Customer Discovery
- Goal Discovery
- AI Summary
- Business Twin Initialization

Deliverable:

Production-ready onboarding flow.

## Phase 8 - Learning Integration

Objective:

Connect Business Profile updates to the Learning System.

Tasks:

- Emit learning signals.
- Update Business Memory.
- Improve Business Twin completeness.

Deliverable:

Learning-enabled capability.

## Package Mapping

Implementation should primarily modify:

```text
packages/domain
packages/application
packages/business-brain
packages/event-bus
```

Later phases may add:

```text
apps/web
```

No changes should be required to:

```text
packages/shared
packages/contracts
packages/decision-brain
packages/execution-layer
packages/agents
packages/capability-layer
```

## Definition of Done

Business Profile is complete when:

- Domain model is implemented.
- Application use cases work.
- Business Brain initializes Business Twin.
- Events are published.
- API is functional.
- UI flow is complete.
- Learning System receives updates.
- Capability audit passes.
- Documentation is synchronized.

## Risks

Potential implementation risks:

- Business Twin schema drift.
- Event contract changes.
- Domain duplication.
- Inconsistent profile completeness rules.

Mitigation:

- Follow canonical domain model.
- Reuse runtime contracts.
- Publish events only through Event Bus.
- Review every implementation through Capability Audit.

## Testing Strategy

Required tests:

- Domain tests
- Application tests
- Contract tests
- Event tests
- Business Brain integration tests
- API tests
- End-to-end onboarding flow

## Exit Criteria

Capability-001 is complete when:

- Business Profile initializes the Business Twin.
- AI can accurately summarize the business.
- Future capabilities consume Business Profile without redefining business identity.
- Capability Audit is approved.

## Future Integration

Business Profile becomes the upstream dependency for:

- CRM
- Campaign
- Content
- Revenue
- Analytics
- AI Coach

No future capability should redefine Business Identity.

## Guiding Principle

Business Profile is the first production capability.

Every future capability should inherit business understanding from it rather than collecting duplicate information.
