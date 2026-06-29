## CAP-002 S-003 Interaction Timeline Build Specification

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-003 Interaction Timeline

Status: Ready for Implementation

Prerequisite Slices:

- CAP-002 S-001 Customer Foundation - PASS
- CAP-002 S-002 Lead Management - PASS

Reference Capability:

- CAP-001 Business Profile v1.0 (Frozen)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.1

## Objective

Implement the Interaction Timeline as the authoritative history of customer engagements.

The timeline provides an immutable chronological record of all customer interactions and becomes the foundation for customer service, sales activities, and future analytics.

## Scope

Included:

- Interaction aggregate
- Interaction entity
- Interaction value objects
- Interaction repository interface
- In-memory Interaction repository
- Interaction application service
- Customer notes
- Timeline queries
- Interaction domain events
- Unit tests

Excluded:

- Follow-up scheduling (S-004)
- Customer segmentation (S-005)
- Search and query optimization (S-006)
- Import / Export (S-007)
- External persistence

## Prerequisites

Required:

- Customer aggregate available
- Lead aggregate available
- CustomerApplicationService available
- LeadApplicationService available

Interaction references Customer only.

Interaction never owns Customer.

## Domain Model

## Aggregate Root

Interaction

## Entity

Interaction

Core properties:

- interactionId
- customerId
- interactionType
- interactionChannel
- outcome
- note
- occurredAt
- recordedBy
- metadata

## Value Objects

Implement:

- InteractionId
- InteractionType
- InteractionChannel
- InteractionOutcome
- InteractionTimestamp

## Supported Interaction Types

Minimum implementation:

- Call
- Meeting
- Email
- WhatsApp
- SMS
- Visit
- Note

Future interaction types must extend this enumeration without breaking compatibility.

## Aggregate Invariants

- InteractionId is immutable.
- CustomerId is immutable.
- Every Interaction belongs to exactly one Customer.
- occurredAt is immutable.
- Interaction history is append-only.
- Existing interactions cannot be edited.
- Existing interactions cannot be deleted.
- Corrections require new interactions.

## Repository

## Interface

InteractionRepository

Required operations:

- save()
- findById()
- findByCustomer()
- timeline()

Implementation:

- In-memory repository
- Chronological ordering
- Snapshot persistence

## Application Layer

Implement:

InteractionApplicationService

Operations:

- recordInteraction()
- addCustomerNote()
- getTimeline()

Responsibilities:

- Validate command shape.
- Verify Customer exists.
- Create Interaction aggregate.
- Persist Interaction.
- Publish events.

Business rules remain inside the aggregate.

## Timeline Behavior

Timeline ordering:

```text
Oldest
  -> Interaction
  -> Interaction
  -> Interaction
  -> Newest
```

Ordering is based on `occurredAt`.

When timestamps are identical, preserve insertion order.

## Commands

Implement:

- RecordInteractionCommand
- AddCustomerNoteCommand

## Queries

Implement:

- GetInteraction
- GetCustomerTimeline

## Domain Events

Implement:

- InteractionRecorded
- CustomerNoteAdded

Events must follow the standard CAP-002 metadata contract.

## Public API

Export:

- Interaction
- InteractionRepository
- InMemoryInteractionRepository
- InteractionApplicationService
- Commands
- Queries
- Events
- Value Objects

Do not introduce breaking changes to S-001 or S-002 APIs.

## Testing

## Aggregate Tests

Required:

- Create interaction
- Record note
- Immutable timestamp
- Immutable customerId
- Prevent modification
- Prevent deletion

## Repository Tests

Required:

- Save interaction
- Find by ID
- Find by customer
- Timeline ordering

## Application Tests

Required:

- Record interaction workflow
- Customer note workflow
- Timeline retrieval
- Event publication
- Customer existence validation

## Regression Tests

Verify:

- S-001 Customer tests remain green
- S-002 Lead tests remain green

## Validation

Run:

```text
pnpm --filter @nextshift/domain test
pnpm --filter @nextshift/application test

pnpm --filter @nextshift/domain typecheck
pnpm --filter @nextshift/application typecheck
```

Requirements:

- All tests pass.
- Typecheck passes.
- No regressions.

## Expected Deliverables

Domain:

- Interaction aggregate
- Value objects
- Repository interface

Application:

- InteractionApplicationService
- Commands
- Queries

Infrastructure:

- In-memory Interaction repository

Documentation:

- Implementation Report
- Verification Checklist
- Audit
- Release Notes

## Constraints

- Interaction history is immutable.
- Interaction never modifies Customer state.
- Customer ownership remains within S-001.
- No runtime redesign.
- No governance changes.
- No infrastructure coupling.
- Preserve backward compatibility.

## Exit Criteria

S-003 is complete when:

- Interaction aggregate implemented.
- Timeline retrieval operational.
- Customer notes operational.
- Interaction events implemented.
- Tests passing.
- Typecheck passing.
- S-001 and S-002 regression tests passing.
- Documentation prepared for verification.

## Ready for Implementation

Upon approval, proceed to:

1. CAP-002 S-003 Interaction Timeline Implementation Tasks
2. CAP-002 S-003 Interaction Timeline Implementation

Status:

```text
Ready for Implementation
```
