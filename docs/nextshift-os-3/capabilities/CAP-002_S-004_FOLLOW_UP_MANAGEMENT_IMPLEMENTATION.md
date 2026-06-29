## CAP-002 S-004 Follow-Up Management Implementation

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-004 Follow-Up Management

Status: Ready for Implementation

Prerequisite Slices:

- CAP-002 S-001 Customer Foundation - PASS
- CAP-002 S-002 Lead Management - PASS
- CAP-002 S-003 Interaction Timeline - PASS

Prerequisite Documents:

- S-004 Build Specification - Approved

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.1

## Purpose

Execute the implementation of the Follow-Up Management slice.

The implementation introduces customer follow-up scheduling, completion, cancellation, and overdue detection while preserving the existing Customer, Lead, and Interaction APIs.

## Objectives

Deliver:

- FollowUp aggregate
- FollowUp repository
- FollowUp application service
- Pending and overdue queries
- Reminder model
- FollowUp domain events
- Automated tests

## Work Packages

## WP-001 Domain Layer

Implement:

- FollowUp aggregate
- FollowUp entity
- FollowUp value objects
- Aggregate invariants

Suggested file:

```text
packages/domain/src/follow-up/index.ts
```

Completion Criteria:

- Aggregate compiles.
- Invariants enforced.
- Public exports updated.

## WP-002 Repository Layer

Implement:

- FollowUpRepository
- InMemoryFollowUpRepository

Responsibilities:

- Persist FollowUp snapshots.
- Retrieve FollowUps by customer.
- Retrieve pending FollowUps.
- Retrieve overdue FollowUps.

Completion Criteria:

- Repository interface complete.
- Stable ordering preserved.

## WP-003 Application Layer

Implement:

```text
packages/application/src/follow-up/index.ts
```

Application service:

- FollowUpApplicationService

Operations:

- scheduleFollowUp()
- updateFollowUp()
- completeFollowUp()
- cancelFollowUp()
- listPending()
- listOverdue()

Responsibilities:

- Validate commands.
- Verify Customer exists.
- Persist FollowUp.
- Publish events.

Business rules remain inside the aggregate.

## WP-004 Overdue Detection

Implement derived overdue status.

Rules:

- Pending
- dueAt earlier than current time

Overdue must not be stored as mutable state.

It must always be derived.

## WP-005 Domain Events

Implement:

- FollowUpScheduled
- FollowUpUpdated
- FollowUpCompleted
- FollowUpCancelled
- FollowUpOverdue

Events must follow the CAP-002 event metadata specification.

## WP-006 Public API

Export:

- FollowUp
- FollowUpRepository
- InMemoryFollowUpRepository
- FollowUpApplicationService
- Commands
- Queries
- Events
- Value Objects

Maintain backward compatibility with S-001 through S-003.

## WP-007 Tests

## Domain Tests

Required:

- Schedule follow-up
- Update follow-up
- Complete follow-up
- Cancel follow-up
- Detect overdue
- Prevent invalid transitions

## Repository Tests

Required:

- Save
- Find by ID
- Find by Customer
- Pending retrieval
- Overdue retrieval

## Application Tests

Required:

- Schedule workflow
- Completion workflow
- Cancellation workflow
- Pending query
- Overdue query
- Event publication
- Customer validation

## Regression Tests

Verify:

- S-001 PASS
- S-002 PASS
- S-003 PASS

## WP-008 Validation

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

## Deliverables

Implementation must produce:

- FollowUp aggregate
- Repository
- Application service
- Pending and overdue queries
- Domain events
- Updated package exports

## Constraints

- FollowUp references Customer but never owns Customer.
- FollowUp may reference Interaction but must never modify it.
- No runtime redesign.
- No governance changes.
- Preserve backward compatibility.

## Completion Criteria

Implementation is complete when:

- All work packages complete.
- Scheduling operational.
- Pending and overdue queries operational.
- Events implemented.
- Tests passing.
- Typecheck passing.
- Regression tests passing.

Implementation Status:

- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Next Phase

After implementation completes:

1. CAP-002 S-004 Follow-Up Management Implementation Report
2. CAP-002 S-004 Follow-Up Management Verification Checklist
3. CAP-002 S-004 Follow-Up Management Audit
4. CAP-002 S-004 Follow-Up Management Release Notes

Status:

```text
Ready for Implementation
```
