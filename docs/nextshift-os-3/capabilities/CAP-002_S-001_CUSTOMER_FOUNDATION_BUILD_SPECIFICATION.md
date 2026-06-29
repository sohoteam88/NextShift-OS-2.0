## CAP-002 S-001 Customer Foundation Build Specification

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-001 Customer Foundation

Status: Ready for Implementation

Reference Capability: CAP-001 Business Profile v1.0 (Frozen)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.0

---

## Objective

Implement the foundational Customer aggregate for the CRM capability.

This slice establishes the canonical customer lifecycle and replaces the temporary customer domain stub with the production domain model.

---

## Scope

Included:

- Customer aggregate
- Customer entity
- Customer value objects
- Customer repository interface
- In-memory repository implementation
- Customer application service
- Customer domain events
- Customer commands
- Customer queries
- Unit tests
- Public package exports

Excluded:

- Lead
- Interaction
- Follow-up
- Segment
- External persistence
- Search
- Import / Export

---

## Preconditions

The following conditions must be satisfied before implementation begins.

- CAP-001 Cleanup-001 completed.
- Existing customer stub removed.
- Specification documents approved.
- Public API changes reviewed.

---

## Stub Replacement

Replace:

```text
packages/domain/src/customer/index.ts
```

Remove:

- CustomerSegment
- CustomerPersona

These placeholder types shall not remain in the public API.

Replace with:

- Customer aggregate
- Customer value objects
- Customer domain exports

---

## Domain Model

### Aggregate Root

Customer

### Entity

Customer

Core properties:

- customerId
- businessId
- displayName
- email
- phone
- status
- type
- communicationPreference
- tags
- createdAt
- updatedAt
- archivedAt

### Value Objects

Implement:

- CustomerId
- CustomerName
- ContactInformation
- CustomerStatus
- CustomerType
- CommunicationPreference

---

## Invariants

- CustomerId is immutable.
- Display name is required.
- At least one contact method must exist.
- Archived customers cannot be modified.
- Aggregate state must remain internally consistent.

---

## Repository

Interface:

```text
CustomerRepository
```

Required operations:

- save()
- findById()
- findByEmail()
- findByPhone()
- exists()
- archive()

Implementation:

- In-memory repository
- Repository contract isolated from persistence technology
- No database dependency in S-001

---

## Application Layer

Implement:

```text
CustomerApplicationService
```

Operations:

- createCustomer()
- updateCustomer()
- archiveCustomer()
- restoreCustomer()

Responsibilities:

- Validate command structure.
- Load aggregate.
- Invoke domain behavior.
- Persist aggregate.
- Publish domain events.

Business rules remain inside the aggregate.

---

## Commands

Implement command models for:

- CreateCustomer
- UpdateCustomer
- ArchiveCustomer
- RestoreCustomer

Commands contain only input data.

---

## Queries

Implement:

- GetCustomer
- FindCustomerByEmail
- FindCustomerByPhone

Queries contain no business logic.

---

## Domain Events

Implement:

- CustomerCreated
- CustomerUpdated
- CustomerArchived
- CustomerRestored

Events shall follow the standard event metadata contract defined in CAP-002 Events.

---

## Public API

Update package exports.

Expose:

- Customer
- CustomerRepository
- CustomerApplicationService
- Customer events
- Customer value objects

Remove exports for obsolete placeholder types.

---

## Testing

Required unit tests:

### Aggregate

- Create customer
- Update customer
- Archive customer
- Restore customer
- Invariant enforcement

### Repository

- Save
- Retrieve
- Archive
- Exists

### Application Service

- Create workflow
- Update workflow
- Archive workflow
- Restore workflow
- Event publication

All tests must pass.

---

## Type Safety

Requirements:

- TypeScript strict mode passes.
- No implicit any.
- No unused exports.
- Public API compiles successfully.

---

## Expected Deliverables

Domain:

- Customer aggregate
- Value objects
- Repository interface

Application:

- CustomerApplicationService
- Commands
- Queries

Infrastructure:

- In-memory repository

Tests:

- Aggregate tests
- Repository tests
- Application service tests

Documentation:

- Updated exports
- Updated implementation notes

---

## Exit Criteria

S-001 is complete when:

- Customer stub removed.
- Customer aggregate implemented.
- Repository implemented.
- Application service implemented.
- Domain events implemented.
- Public API updated.
- Unit tests passing.
- Typecheck passing.
- Documentation updated.

---

## Build Constraints

- No runtime redesign.
- No governance changes.
- No architectural deviations.
- No persistence technology coupling.
- Aggregate boundaries must remain intact.
- Backward compatibility maintained where applicable.

---

## Ready for Audit

After implementation completes, execute:

- Typecheck
- Unit tests
- Documentation review

Then proceed to:

```text
CAP-002 S-001 Customer Foundation Audit
```

Status: Ready for Implementation
