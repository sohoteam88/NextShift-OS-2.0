## CAP-002 Domain Model

Version: v1.0

Capability: CAP-002 CRM

Status: Draft

Reference Capability: CAP-001 Business Profile v1.0 (Frozen)

---

## Purpose

The CRM Domain Model defines the business concepts, aggregate boundaries, entities, value objects, repositories, domain services, and invariants for Customer Relationship Management.

This model follows the Blueprint v1.0 domain-driven architecture and establishes CRM as the single source of truth for customer relationship data.

---

## Aggregate Roots

The CRM capability consists of the following aggregate roots.

| Aggregate   | Responsibility                            |
| ----------- | ----------------------------------------- |
| Customer    | Customer lifecycle and profile management |
| Lead        | Lead qualification lifecycle              |
| Interaction | Customer interaction history              |
| FollowUp    | Follow-up planning and execution          |
| Segment     | Customer segmentation rules               |

---

## Aggregate - Customer

### Responsibility

Owns the complete customer identity and relationship lifecycle.

### Entities

- Customer

### Value Objects

- CustomerId
- CustomerName
- ContactInformation
- Address
- CommunicationPreference
- CustomerStatus
- CustomerType
- TagCollection

### Child Collections

- Notes
- Tags
- ExternalReferences

### Invariants

- CustomerId is immutable.
- Customer must have a display name.
- At least one contact method is required.
- Archived customers cannot be modified.
- Deleted customers are never physically removed.

---

## Aggregate - Lead

### Responsibility

Manages lead acquisition and qualification.

### Entities

- Lead

### Value Objects

- LeadId
- LeadSource
- LeadStatus
- QualificationScore

### Invariants

- LeadId is immutable.
- A qualified lead can only be converted once.
- Converted leads become Customers.
- Closed leads cannot return to Open state.

---

## Aggregate - Interaction

### Responsibility

Maintains the chronological history of customer engagements.

### Entities

- Interaction

### Value Objects

- InteractionId
- InteractionType
- InteractionTimestamp
- InteractionOutcome
- InteractionChannel

### Invariants

- Interaction belongs to one Customer.
- Timestamp cannot change after creation.
- Interaction history is append-only.

---

## Aggregate - FollowUp

### Responsibility

Schedules and tracks future customer actions.

### Entities

- FollowUp

### Value Objects

- FollowUpId
- DueDate
- Priority
- ReminderRule
- FollowUpStatus

### Invariants

- Follow-up belongs to one Customer.
- Completed follow-ups cannot return to Pending.
- Due date must be valid.

---

## Aggregate - Segment

### Responsibility

Defines logical customer groupings.

### Entities

- Segment

### Value Objects

- SegmentId
- SegmentName
- SegmentRule

### Invariants

- Segment name is unique.
- Segment rules are deterministic.
- Customers may belong to multiple segments.

---

## Domain Relationships

Customer:

- owns Interactions
- owns FollowUps
- belongs to Segments

Lead:

- converts to Customer

Interaction:

- references Customer

FollowUp:

- references Customer

Segment:

- references multiple Customers

---

## Repository Interfaces

### CustomerRepository

- save(Customer)
- find(CustomerId)
- findByEmail()
- findByPhone()
- search()
- archive()

### LeadRepository

- save()
- find()
- convert()
- search()

### InteractionRepository

- save()
- findByCustomer()
- timeline()

### FollowUpRepository

- save()
- findPending()
- findOverdue()

### SegmentRepository

- save()
- find()
- evaluate()

---

## Domain Services

### CustomerMergeService

Responsibilities:

- Merge duplicate customers
- Preserve history
- Consolidate interactions
- Consolidate follow-ups

### CustomerLifecycleService

Responsibilities:

- Activate customer
- Archive customer
- Restore customer
- Change lifecycle status

### SegmentationService

Responsibilities:

- Evaluate segment rules
- Assign customers
- Remove customers
- Refresh memberships

---

## Aggregate Boundaries

Each aggregate owns its own consistency boundary.

Customer:

- does not modify Lead

Lead:

- does not modify Customer directly

Interaction:

- immutable after creation

FollowUp:

- independent lifecycle

Segment:

- owns only membership rules

---

## Global Invariants

- Every Customer has a unique identifier.
- Every Lead converts to at most one Customer.
- Every Interaction references exactly one Customer.
- Every FollowUp references exactly one Customer.
- Customer history is immutable.
- Aggregate boundaries must not be violated.
- Cross-aggregate communication occurs only through application services or domain events.

---

## Domain Events (Preview)

- CustomerCreated
- CustomerUpdated
- CustomerArchived
- LeadCreated
- LeadQualified
- LeadConverted
- InteractionRecorded
- FollowUpScheduled
- FollowUpCompleted
- SegmentAssigned
- SegmentRemoved

Detailed event contracts are defined in the Events phase.

---

## Audit Checklist

- Aggregate roots identified
- Aggregate boundaries defined
- Entities identified
- Value objects identified
- Domain services identified
- Repository interfaces defined
- Invariants documented
- Cross-aggregate rules documented

Status: Ready for Domain Review

---

## Next Phase

CAP-002 Use Cases
