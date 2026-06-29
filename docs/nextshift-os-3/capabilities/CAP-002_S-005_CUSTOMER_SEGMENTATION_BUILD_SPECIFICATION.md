## CAP-002 S-005 Customer Segmentation Build Specification

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-005 Customer Segmentation

Status: Ready for Implementation

Prerequisite Slices:

- CAP-002 S-001 Customer Foundation - PASS
- CAP-002 S-002 Lead Management - PASS
- CAP-002 S-003 Interaction Timeline - PASS
- CAP-002 S-004 Follow-Up Management - PASS

Reference Capability:

- CAP-001 Business Profile v1.0 (Frozen)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.1

## Objective

Implement Customer Segmentation as the fifth CRM implementation slice.

This slice enables rule-based grouping of customers for future sales, marketing, automation, and analytics capabilities.

Segmentation determines customer membership only. It does not execute campaigns or automation.

## Scope

Included:

- Segment aggregate
- Segment entity
- Segment value objects
- Segment repository interface
- In-memory Segment repository
- Segmentation application service
- Membership evaluation
- Manual assignment
- Manual removal
- Segment domain events
- Unit tests

Excluded:

- Marketing campaigns
- Workflow automation
- Recommendation engine
- Search optimization
- External persistence

## Domain Model

## Aggregate Root

Segment

## Entity

Segment

Core properties:

- segmentId
- businessId
- name
- description
- rule
- active
- createdAt
- updatedAt

Membership records:

- customerId
- assignedAt
- assignmentSource

## Value Objects

Implement:

- SegmentId
- SegmentName
- SegmentRule
- SegmentStatus

## Aggregate Invariants

- SegmentId is immutable.
- Segment name is unique within a business.
- Rules are deterministic.
- Duplicate customer membership is prohibited.
- Removing a customer preserves segment history.
- Deactivated segments cannot accept new assignments.

## Repository

## Interface

SegmentRepository

Required operations:

- save()
- findById()
- findByName()
- assignCustomer()
- removeCustomer()
- evaluate()
- listMembers()

Implementation:

- In-memory repository
- Snapshot persistence
- Membership history preserved

## Application Layer

Implement:

SegmentApplicationService

Operations:

- createSegment()
- updateSegment()
- assignCustomer()
- removeCustomer()
- evaluateSegment()
- listMembers()

Responsibilities:

- Validate commands.
- Verify Customer exists.
- Persist Segment.
- Publish events.

Business rules remain inside the aggregate.

## Membership Evaluation

Evaluation may be:

- Manual
- Rule-based

Rules must be deterministic.

Evaluation must never modify Customer aggregates.

Membership belongs exclusively to Segment.

## Commands

Implement:

- CreateSegmentCommand
- UpdateSegmentCommand
- AssignCustomerCommand
- RemoveCustomerCommand
- EvaluateSegmentCommand

## Queries

Implement:

- GetSegment
- GetSegmentMembers
- ListCustomerSegments

## Domain Events

Implement:

- SegmentCreated
- SegmentUpdated
- SegmentAssigned
- SegmentRemoved
- SegmentEvaluated

Events must comply with the CAP-002 event metadata contract.

## Public API

Export:

- Segment
- SegmentRepository
- InMemorySegmentRepository
- SegmentApplicationService
- Commands
- Queries
- Events
- Value Objects

Maintain backward compatibility with S-001 through S-004.

## Testing

## Aggregate Tests

Required:

- Create segment
- Update segment
- Assign customer
- Remove customer
- Prevent duplicate assignment
- Prevent assignment to inactive segment

## Repository Tests

Required:

- Save
- Find by ID
- Find by Name
- Assign
- Remove
- Membership retrieval

## Application Tests

Required:

- Create workflow
- Update workflow
- Assignment workflow
- Removal workflow
- Evaluation workflow
- Event publication
- Customer validation

## Regression Tests

Verify:

- S-001 PASS
- S-002 PASS
- S-003 PASS
- S-004 PASS

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

- Segment aggregate
- Value objects
- Repository interface

Application:

- SegmentApplicationService
- Commands
- Queries

Infrastructure:

- In-memory Segment repository

Documentation:

- Implementation Report
- Verification Checklist
- Audit Report
- Release Notes

## Constraints

- Segment never owns Customer.
- Customer aggregate remains unchanged.
- Membership belongs exclusively to Segment.
- No runtime redesign.
- No governance changes.
- No production persistence.
- Preserve backward compatibility.

## Exit Criteria

S-005 is complete when:

- Segment aggregate implemented.
- Membership management operational.
- Rule evaluation operational.
- Domain events implemented.
- Tests passing.
- Typecheck passing.
- Regression tests passing.
- Documentation prepared for verification.

## Ready for Implementation

Upon approval, proceed to:

```text
CAP-002 S-005 Customer Segmentation Code Implementation
```

Status:

```text
Ready for Implementation
```
