## CAP-002 S-006 Search & Query Build Specification

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-006 Search & Query

Status: Ready for Implementation

Prerequisite Slices:

- CAP-002 S-001 Customer Foundation - PASS
- CAP-002 S-002 Lead Management - PASS
- CAP-002 S-003 Interaction Timeline - PASS
- CAP-002 S-004 Follow-Up Management - PASS
- CAP-002 S-005 Customer Segmentation - PASS

Reference Capability:

- CAP-001 Business Profile v1.0 (Frozen)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.1

## Objective

Implement Search & Query as the sixth CRM implementation slice.

This slice provides read-optimized retrieval across CRM aggregates while preserving aggregate ownership and consistency boundaries.

No business rules are introduced in this slice.

## Scope

Included:

- Customer search
- Lead search
- Interaction timeline query
- Follow-up query
- Segment membership query
- Unified CRM query service
- Query DTOs
- Unit tests

Excluded:

- Full-text indexing
- External search engines
- Analytics
- Reporting
- Production persistence
- Caching

## Design Principles

- Queries never modify aggregate state.
- Queries do not publish domain events.
- Queries do not bypass repository contracts.
- Aggregate ownership remains unchanged.
- Read models are assembled from existing repositories.

## Query Services

## Customer Queries

Implement:

- searchCustomers()
- getCustomerById()
- getCustomerByEmail()
- getCustomerByPhone()

Supported filters:

- Display name
- Email
- Phone
- Status
- Type

## Lead Queries

Implement:

- searchLeads()
- getLeadById()

Supported filters:

- Status
- Source
- Qualification score

## Interaction Queries

Implement:

- getCustomerTimeline()
- getInteractionById()

Timeline requirements:

- Chronological order
- Stable ordering
- Immutable history

## Follow-Up Queries

Implement:

- listPendingFollowUps()
- listOverdueFollowUps()
- getFollowUpById()

Supported filters:

- Customer
- Status
- Due date
- Priority

## Segment Queries

Implement:

- listSegments()
- getSegmentById()
- listSegmentMembers()
- listCustomerSegments()

## Unified Query Service

Implement:

CRMQueryService

Responsibilities:

- Coordinate repository queries.
- Compose read models.
- Return immutable DTOs.
- No domain logic.

## Public API

Export:

- CRMQueryService
- Query DTOs
- Query interfaces

No changes to existing command APIs.

## Testing

## Query Tests

Required:

- Customer search
- Lead search
- Timeline retrieval
- Pending follow-up retrieval
- Overdue follow-up retrieval
- Segment membership retrieval

## Regression Tests

Verify:

- S-001 PASS
- S-002 PASS
- S-003 PASS
- S-004 PASS
- S-005 PASS

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

Application:

- CRMQueryService
- Query DTOs
- Query interfaces

Documentation:

- Implementation Report
- Verification Checklist
- Audit Report
- Release Notes

## Constraints

- Read-only operations only.
- No domain mutations.
- No event publication.
- No runtime redesign.
- No governance changes.
- Preserve backward compatibility.

## Exit Criteria

S-006 is complete when:

- All query services implemented.
- Read models operational.
- Tests passing.
- Typecheck passing.
- Regression tests passing.
- Documentation prepared for verification.

## Ready for Implementation

Upon approval, proceed to:

```text
CAP-002 S-006 Search & Query Code Implementation
```

Status:

```text
Ready for Implementation
```
