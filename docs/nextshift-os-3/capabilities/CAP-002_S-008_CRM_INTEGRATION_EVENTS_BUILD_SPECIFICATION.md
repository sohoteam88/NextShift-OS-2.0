## CAP-002 S-008 CRM Integration Events Build Specification

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-008 CRM Integration Events

Status: Ready for Implementation

Prerequisite Slices:

- CAP-002 S-001 Customer Foundation - PASS
- CAP-002 S-002 Lead Management - PASS
- CAP-002 S-003 Interaction Timeline - PASS
- CAP-002 S-004 Follow-Up Management - PASS
- CAP-002 S-005 Customer Segmentation - PASS
- CAP-002 S-006 Search & Query - PASS
- CAP-002 S-007 Import & Export - PASS

Reference Capability:

- CAP-001 Business Profile v1.0 (Frozen)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.1

## Objective

Implement CRM Integration Events as the eighth and final implementation slice.

This slice provides a unified outbound integration event layer that exposes CRM domain events to external capabilities and future infrastructure adapters without changing existing domain aggregates.

## Scope

Included:

- CRMIntegrationEventPublisher
- Integration event mapping
- Unified outbound event contract
- Event serialization
- Integration event DTOs
- Event replay support (in-memory)
- Unit tests

Excluded:

- Message brokers
- Webhooks
- Kafka / RabbitMQ
- Event Store
- External queues
- Production infrastructure

## Design Principles

- Domain events remain unchanged.
- Integration events are derived from domain events.
- No aggregate mutations.
- No business rules.
- Integration layer depends on domain events only.

## Integration Publisher

Implement:

- CRMIntegrationEventPublisher

Responsibilities:

- Receive CRM domain events
- Transform to integration events
- Preserve correlation metadata
- Serialize immutable payloads

## Supported Sources

## Customer

- CustomerCreated
- CustomerUpdated
- CustomerArchived
- CustomerRestored

## Lead

- LeadCreated
- LeadUpdated
- LeadQualified
- LeadConverted
- LeadClosed

## Interaction

- InteractionRecorded
- CustomerNoteAdded

## Follow-Up

- FollowUpScheduled
- FollowUpUpdated
- FollowUpCompleted
- FollowUpCancelled
- FollowUpOverdue

## Segment

- SegmentCreated
- SegmentUpdated
- SegmentAssigned
- SegmentRemoved
- SegmentEvaluated

## Integration Event Contract

Every integration event must include:

- integrationEventId
- eventType
- aggregateType
- aggregateId
- occurredAt
- correlationId
- causationId
- version
- payload

Payload must be immutable.

## Event Mapping

Requirements:

- One integration event per domain event.
- Preserve payload semantics.
- No information loss.
- Preserve event ordering.

## Replay Support

Provide:

- In-memory replay store
- Read-only replay API

Replay does not modify aggregates.

## Public API

Export:

- CRMIntegrationEventPublisher
- IntegrationEvent
- IntegrationEventMapper
- Replay interfaces

No breaking changes to S-001 through S-007.

## Testing

## Mapping Tests

Required:

- Customer events
- Lead events
- Interaction events
- Follow-up events
- Segment events

## Replay Tests

Required:

- Replay ordering
- Replay immutability
- Replay filtering

## Regression Tests

Verify:

- S-001 PASS
- S-002 PASS
- S-003 PASS
- S-004 PASS
- S-005 PASS
- S-006 PASS
- S-007 PASS

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

- CRMIntegrationEventPublisher
- Integration event DTOs
- Event mapper
- Replay store

Documentation:

- Implementation Report
- Verification Checklist
- Audit Report
- Release Notes

## Constraints

- No aggregate mutation.
- No domain rule duplication.
- Preserve domain event contracts.
- No runtime redesign.
- No governance changes.
- Preserve backward compatibility.

## Exit Criteria

S-008 is complete when:

- Integration publisher implemented.
- Event mapping operational.
- Replay support operational.
- Tests passing.
- Typecheck passing.
- Regression tests passing.
- Documentation prepared for verification.

## Ready for Implementation

Upon approval, proceed to:

```text
CAP-002 S-008 CRM Integration Events Code Implementation
```

Status:

```text
Ready for Implementation
```
