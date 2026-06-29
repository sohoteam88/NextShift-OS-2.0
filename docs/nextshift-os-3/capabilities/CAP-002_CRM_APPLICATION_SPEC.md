## CAP-002 Application Specification

Version: v1.0

Capability: CAP-002 CRM

Status: Draft

Reference Capability: CAP-001 Business Profile v1.0 (Frozen)

---

## Purpose

This document defines the application layer for the CRM capability.

The application layer coordinates business operations by orchestrating domain aggregates, repositories, and domain services.

It contains no business rules and delegates all domain decisions to the domain model.

---

## Responsibilities

The application layer is responsible for:

- Accepting application commands.
- Loading aggregate roots.
- Invoking domain behavior.
- Persisting aggregate changes.
- Publishing domain events.
- Managing transaction boundaries.
- Coordinating cross-aggregate workflows.

The application layer must not implement business rules.

---

## Architecture

```text
Presentation
      |
      v
Application Layer
      |
      +-- Commands
      +-- Queries
      +-- Application Services
      +-- Repository Interfaces
      +-- Event Publisher
      |
      v
Domain Layer
```

---

## Commands

### Customer Commands

- CreateCustomer
- UpdateCustomer
- ArchiveCustomer
- RestoreCustomer
- MergeCustomers

### Lead Commands

- CreateLead
- UpdateLead
- QualifyLead
- ConvertLead
- CloseLead

### Interaction Commands

- RecordInteraction
- AddCustomerNote

### Follow-Up Commands

- ScheduleFollowUp
- UpdateFollowUp
- CompleteFollowUp
- CancelFollowUp

### Segment Commands

- CreateSegment
- UpdateSegment
- AssignSegment
- RemoveSegment
- EvaluateSegments

---

## Queries

### Customer Queries

- GetCustomer
- SearchCustomers
- GetCustomerTimeline

### Lead Queries

- GetLead
- SearchLeads

### Follow-Up Queries

- GetFollowUp
- ListPendingFollowUps
- ListOverdueFollowUps

### Segment Queries

- GetSegment
- ListSegments

---

## Application Services

### CustomerApplicationService

Responsibilities:

- Execute customer commands.
- Coordinate Customer aggregate.
- Publish customer events.

Supported operations:

- createCustomer()
- updateCustomer()
- archiveCustomer()
- restoreCustomer()
- mergeCustomers()

### LeadApplicationService

Responsibilities:

- Execute lead lifecycle operations.
- Coordinate Lead aggregate.
- Invoke Customer creation during conversion.

Supported operations:

- createLead()
- updateLead()
- qualifyLead()
- convertLead()
- closeLead()

### InteractionApplicationService

Responsibilities:

- Record customer interactions.
- Append notes.
- Retrieve interaction timeline.

Supported operations:

- recordInteraction()
- addCustomerNote()
- getTimeline()

### FollowUpApplicationService

Responsibilities:

- Manage follow-up lifecycle.

Supported operations:

- scheduleFollowUp()
- updateFollowUp()
- completeFollowUp()
- cancelFollowUp()
- listOverdue()

### SegmentApplicationService

Responsibilities:

- Manage customer segments.
- Evaluate membership rules.

Supported operations:

- createSegment()
- updateSegment()
- assignCustomer()
- removeCustomer()
- evaluateSegments()

---

## Repository Contracts

The application layer depends only on repository interfaces defined in the domain model.

Repositories:

- CustomerRepository
- LeadRepository
- InteractionRepository
- FollowUpRepository
- SegmentRepository

No infrastructure implementation is referenced here.

---

## Domain Services

Application services may invoke:

- CustomerMergeService
- CustomerLifecycleService
- SegmentationService

Business decisions remain inside domain services.

---

## Event Publishing

After a successful transaction, the application layer publishes domain events.

Examples:

- CustomerCreated
- CustomerUpdated
- LeadConverted
- InteractionRecorded
- FollowUpScheduled
- SegmentAssigned

Failed transactions must not publish events.

---

## Transaction Boundaries

Each command executes within a single application transaction.

General flow:

1. Validate command structure.
2. Load aggregate(s).
3. Execute domain behavior.
4. Persist aggregate changes.
5. Commit transaction.
6. Publish domain events.

---

## Error Handling

Application services return standardized application errors.

Examples:

- CustomerNotFound
- LeadNotFound
- SegmentNotFound
- DuplicateCustomer
- InvalidLeadState
- InvalidCustomerState
- FollowUpNotFound
- ValidationFailed

Application errors must not expose infrastructure details.

---

## Authorization

Authorization is enforced before command execution.

Typical permissions include:

- Customer.Create
- Customer.Update
- Customer.Archive
- Lead.Convert
- Interaction.Record
- FollowUp.Manage
- Segment.Manage

Authorization policies are implemented outside the domain model.

---

## Dependency Rules

The application layer may depend on:

- Domain layer
- Repository interfaces
- Event publisher
- Transaction manager

The application layer must not depend on:

- Database implementations
- HTTP frameworks
- UI components
- Infrastructure services

---

## Audit Checklist

- Commands defined.
- Queries defined.
- Application services identified.
- Repository contracts referenced.
- Domain services coordinated.
- Transaction boundaries documented.
- Event publishing specified.
- Dependency rules respected.

Status: Ready for Implementation Slices.

---

## Next Phase

CAP-002 Implementation Slices
