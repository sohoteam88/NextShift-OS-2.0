## CAP-002 Events

Version: v1.0

Capability: CAP-002 CRM

Status: Draft

Reference Capability: CAP-001 Business Profile v1.0 (Frozen)

---

## Purpose

This document defines the domain events published by the CRM capability.

Domain events represent completed business facts that have occurred within the CRM domain.

They are immutable and may be consumed by other capabilities through the application layer.

---

## Event Principles

- Events describe facts that have already happened.
- Events are immutable.
- Events are published only after successful transaction completion.
- Events do not expose internal aggregate state.
- Events are versioned to support backward compatibility.

---

## Event Metadata

Every event contains the following metadata.

| Field         | Description                    |
| ------------- | ------------------------------ |
| eventId       | Unique event identifier        |
| eventType     | Domain event name              |
| aggregateId   | Aggregate identifier           |
| aggregateType | Aggregate root name            |
| occurredAt    | UTC timestamp                  |
| version       | Event schema version           |
| correlationId | Request correlation identifier |
| causationId   | Triggering command identifier  |

---

## Customer Events

### CustomerCreated

Trigger:

A new customer is successfully created.

Payload:

- customerId
- customerName
- customerType
- status
- createdAt

### CustomerUpdated

Trigger:

Customer profile information changes.

Payload:

- customerId
- updatedFields
- updatedAt

### CustomerArchived

Trigger:

Customer is archived.

Payload:

- customerId
- archivedAt
- reason

### CustomerRestored

Trigger:

Archived customer is restored.

Payload:

- customerId
- restoredAt

### CustomerMerged

Trigger:

Duplicate customer records are merged.

Payload:

- masterCustomerId
- mergedCustomerId
- mergedAt

---

## Lead Events

### LeadCreated

Trigger:

A new lead enters the CRM.

Payload:

- leadId
- source
- createdAt

### LeadUpdated

Trigger:

Lead information changes.

Payload:

- leadId
- updatedFields
- updatedAt

### LeadQualified

Trigger:

Lead meets qualification criteria.

Payload:

- leadId
- qualificationScore
- qualifiedAt

### LeadConverted

Trigger:

Lead is converted into a customer.

Payload:

- leadId
- customerId
- convertedAt

### LeadClosed

Trigger:

Lead lifecycle ends without conversion.

Payload:

- leadId
- reason
- closedAt

---

## Interaction Events

### InteractionRecorded

Trigger:

A customer interaction is recorded.

Payload:

- interactionId
- customerId
- interactionType
- channel
- occurredAt

### CustomerNoteAdded

Trigger:

An internal customer note is added.

Payload:

- noteId
- customerId
- createdAt

---

## Follow-Up Events

### FollowUpScheduled

Trigger:

A follow-up task is created.

Payload:

- followUpId
- customerId
- dueDate
- priority

### FollowUpUpdated

Trigger:

Follow-up details change.

Payload:

- followUpId
- updatedFields
- updatedAt

### FollowUpCompleted

Trigger:

Follow-up is completed.

Payload:

- followUpId
- completedAt

### FollowUpCancelled

Trigger:

Follow-up is cancelled.

Payload:

- followUpId
- cancelledAt
- reason

### FollowUpOverdue

Trigger:

A follow-up passes its due date without completion.

Payload:

- followUpId
- customerId
- dueDate

---

## Segment Events

### SegmentCreated

Trigger:

A new segment is created.

Payload:

- segmentId
- segmentName

### SegmentUpdated

Trigger:

Segment definition changes.

Payload:

- segmentId
- updatedAt

### SegmentAssigned

Trigger:

Customer joins a segment.

Payload:

- customerId
- segmentId
- assignedAt

### SegmentRemoved

Trigger:

Customer leaves a segment.

Payload:

- customerId
- segmentId
- removedAt

---

## Event Publishing Rules

- Publish events only after aggregate persistence succeeds.
- One business transaction may publish multiple events.
- Event ordering is guaranteed only within the same aggregate.
- Consumers must treat events as eventually consistent.

---

## Event Consumers

Potential downstream consumers include:

- Sales Capability
- Marketing Capability
- Customer Service Capability
- Analytics Capability
- Notification Capability
- Automation Engine

CRM does not depend on downstream consumers.

---

## Event Versioning

All events begin with schema version **1.0**.

Future schema changes must:

- Preserve backward compatibility where possible.
- Introduce new versions for breaking changes.
- Never modify historical event payloads.

---

## Audit Checklist

- Event names follow past-tense convention.
- Events represent completed business facts.
- Payloads exclude internal implementation details.
- Aggregate boundaries are respected.
- Metadata is standardized.
- Publishing rules are documented.
- Downstream dependencies remain loosely coupled.

Status: Ready for Application Specification.

---

## Next Phase

CAP-002 Application Specification
