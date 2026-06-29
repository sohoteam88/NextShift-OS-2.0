## CAP-002 S-004 Follow-Up Management Build Specification

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-004 Follow-Up Management

Status: Ready for Implementation

Prerequisite Slices:

- CAP-002 S-001 Customer Foundation - PASS
- CAP-002 S-002 Lead Management - PASS
- CAP-002 S-003 Interaction Timeline - PASS

Reference Capability:

- CAP-001 Business Profile v1.0 (Frozen)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.1

## Objective

Implement Follow-Up Management as the fourth CRM implementation slice.

This slice provides structured follow-up planning, execution tracking, reminders, and overdue detection for customer engagement activities.

The implementation builds upon the Customer, Lead, and Interaction capabilities without modifying their aggregate boundaries.

## Scope

Included:

- FollowUp aggregate
- FollowUp entity
- FollowUp value objects
- FollowUp repository interface
- In-memory FollowUp repository
- FollowUp application service
- Reminder scheduling model
- Overdue detection
- FollowUp domain events
- Unit tests

Excluded:

- External notification delivery
- Calendar integration
- Workflow automation engine
- Customer segmentation
- Search optimization
- Production persistence

## Domain Model

## Aggregate Root

FollowUp

## Entity

FollowUp

Core properties:

- followUpId
- customerId
- interactionId (optional)
- title
- description
- priority
- status
- dueAt
- completedAt
- cancelledAt
- assignedTo
- createdAt
- updatedAt

## Value Objects

Implement:

- FollowUpId
- FollowUpPriority
- FollowUpStatus
- DueTimestamp

## Lifecycle

```text
Pending
  -> Complete
  -> Cancel
```

Overdue is a derived state based on:

- Pending
- dueAt < current time

## Aggregate Invariants

- FollowUpId is immutable.
- CustomerId is immutable.
- Due date is required.
- Completed follow-ups cannot be modified.
- Cancelled follow-ups cannot be completed.
- Completed follow-ups require completedAt.
- Cancelled follow-ups require cancelledAt.
- Follow-ups are never physically deleted.

## Repository

## Interface

FollowUpRepository

Required operations:

- save()
- findById()
- findByCustomer()
- findPending()
- findOverdue()
- complete()
- cancel()

Implementation:

- In-memory repository
- Snapshot persistence
- Stable ordering

## Application Layer

Implement:

FollowUpApplicationService

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

## Commands

Implement:

- ScheduleFollowUpCommand
- UpdateFollowUpCommand
- CompleteFollowUpCommand
- CancelFollowUpCommand

## Queries

Implement:

- GetFollowUp
- GetCustomerFollowUps
- ListPendingFollowUps
- ListOverdueFollowUps

## Domain Events

Implement:

- FollowUpScheduled
- FollowUpUpdated
- FollowUpCompleted
- FollowUpCancelled
- FollowUpOverdue

Events must comply with the CAP-002 event metadata contract.

## Public API

Export:

- FollowUp
- FollowUpRepository
- InMemoryFollowUpRepository
- FollowUpApplicationService
- Commands
- Queries
- Events
- Value Objects

Preserve backward compatibility with S-001, S-002, and S-003.

## Testing

## Aggregate Tests

Required:

- Schedule follow-up
- Update follow-up
- Complete follow-up
- Cancel follow-up
- Prevent invalid transitions
- Detect overdue state

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
- Overdue query
- Event publication
- Customer validation

## Regression Tests

Verify:

- S-001 Customer tests remain green
- S-002 Lead tests remain green
- S-003 Interaction tests remain green

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

- FollowUp aggregate
- Value objects
- Repository interface

Application:

- FollowUpApplicationService
- Commands
- Queries

Infrastructure:

- In-memory FollowUp repository

Documentation:

- Implementation Report
- Verification Checklist
- Audit
- Release Notes

## Constraints

- FollowUp references Customer but does not own Customer.
- FollowUp may reference Interaction but does not modify it.
- No runtime redesign.
- No governance changes.
- No production persistence.
- Preserve backward compatibility.

## Exit Criteria

S-004 is complete when:

- FollowUp aggregate implemented.
- Scheduling operational.
- Completion and cancellation operational.
- Overdue detection operational.
- Domain events implemented.
- Tests passing.
- Typecheck passing.
- Regression tests passing.
- Documentation prepared for verification.

## Ready for Implementation

Upon approval, proceed to:

1. CAP-002 S-004 Follow-Up Management Implementation
2. Code Implementation
3. Verification
4. Audit
5. Release

Status:

```text
Ready for Implementation
```
