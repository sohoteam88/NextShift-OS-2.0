## CAP-002 S-002 Lead Management Build Specification

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-002 Lead Management

Status: Ready for Implementation

Reference Capability:

- CAP-001 Business Profile v1.0 (Frozen)

Prerequisite Slice:

- CAP-002 S-001 Customer Foundation (PASS)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.0

---

## Objective

Implement Lead Management as the second CRM implementation slice.

This slice introduces the Lead aggregate and its lifecycle, culminating in the conversion of a qualified Lead into a Customer.

Customer creation must reuse the S-001 Customer Foundation rather than introducing duplicate customer creation logic.

---

## Scope

Included:

- Lead aggregate
- Lead entity
- Lead value objects
- Lead repository interface
- In-memory Lead repository
- Lead application service
- Lead domain events
- Lead qualification
- Lead conversion to Customer
- Unit tests
- Public API updates

Excluded:

- Interaction history
- Follow-up management
- Segmentation
- Search
- Import / Export
- External persistence

---

## Prerequisites

The following must already be complete.

- CAP-002 S-001 Audit = PASS
- Customer aggregate available
- Customer repository available
- Customer application service available
- Customer events available

---

## Domain Model

### Aggregate Root

Lead

### Entity

Lead

Core properties:

- leadId
- businessId
- displayName
- email
- phone
- source
- status
- qualificationScore
- createdAt
- updatedAt
- convertedAt

### Value Objects

Implement:

- LeadId
- LeadSource
- LeadStatus
- QualificationScore

---

## Lifecycle

```text
New
 |
 v
Qualified
 |
 v
Converted
```

Alternative terminal state:

```text
New
 |
 v
Closed
```

---

## Invariants

- LeadId is immutable.
- Display name is required.
- At least one contact method is required.
- Qualified leads may be converted once.
- Converted leads cannot be updated.
- Closed leads cannot be reopened.
- A Lead may create only one Customer.

---

## Repository

### Interface

LeadRepository

Required operations:

- save()
- findById()
- findByEmail()
- findByPhone()
- exists()
- close()

Implementation:

- In-memory repository
- Repository contract isolated from persistence technology

---

## Application Layer

Implement:

```text
LeadApplicationService
```

Operations:

- createLead()
- updateLead()
- qualifyLead()
- convertLead()
- closeLead()

---

## Conversion Workflow

Lead conversion must follow this sequence:

1. Load Lead aggregate.
2. Verify Lead is Qualified.
3. Create Customer using S-001 Customer APIs.
4. Persist Customer.
5. Mark Lead as Converted.
6. Persist Lead.
7. Publish events.

Customer creation logic must not be duplicated.

---

## Commands

Implement:

- CreateLeadCommand
- UpdateLeadCommand
- QualifyLeadCommand
- ConvertLeadCommand
- CloseLeadCommand

---

## Queries

Implement:

- GetLead
- FindLeadByEmail
- FindLeadByPhone

---

## Domain Events

Implement:

- LeadCreated
- LeadUpdated
- LeadQualified
- LeadConverted
- LeadClosed

Event metadata must follow the CAP-002 Events specification.

---

## Public API

Add exports for:

- Lead
- LeadRepository
- InMemoryLeadRepository
- LeadApplicationService
- Lead commands
- Lead queries
- Lead domain events
- Lead value objects

No breaking changes to the S-001 Customer API.

---

## Testing

Required unit tests:

### Aggregate

- Create lead
- Update lead
- Qualify lead
- Convert lead
- Close lead
- Prevent second conversion
- Prevent update after conversion

### Repository

- Save
- Find by ID
- Find by Email
- Find by Phone
- Exists
- Close

### Application Service

- Create workflow
- Update workflow
- Qualification workflow
- Conversion workflow
- Close workflow
- Event publication
- Customer created during conversion
- No duplicate customer creation

---

## Type Safety

Requirements:

- Domain typecheck passes.
- Application typecheck passes.
- No public API regressions.
- Existing S-001 tests remain green.

---

## Expected Deliverables

Domain:

- Lead aggregate
- Lead value objects
- Lead repository interface

Application:

- LeadApplicationService
- Commands
- Queries

Infrastructure:

- In-memory Lead repository

Tests:

- Aggregate tests
- Repository tests
- Application service tests
- Lead-to-Customer conversion tests

Documentation:

- Implementation Report
- Verification Checklist
- Release Notes

---

## Exit Criteria

S-002 is complete when:

- Lead aggregate implemented.
- Lead lifecycle operational.
- LeadRepository implemented.
- LeadApplicationService implemented.
- Lead conversion reuses Customer foundation.
- Lead events implemented.
- Unit tests passing.
- Typecheck passing.
- Existing S-001 regression tests passing.
- Documentation updated.

---

## Non-Negotiable Constraints

- Do not modify the Customer aggregate contract.
- Do not duplicate customer creation logic.
- Do not introduce infrastructure dependencies.
- Do not redesign runtime architecture.
- Do not alter governance.
- Do not bypass Lead qualification before conversion.

---

## Ready for Implementation

Upon completion, generate:

1. CAP-002 S-002 Lead Management Implementation Report
2. CAP-002 S-002 Lead Management Verification Checklist
3. CAP-002 S-002 Lead Management Audit
4. CAP-002 S-002 Lead Management Release Notes

Status: Ready for Codex Implementation.
