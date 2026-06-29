## CAP-002 S-001 Customer Foundation Implementation Tasks

Version: v1.0

Capability: CAP-002 CRM

Slice: S-001 Customer Foundation

Status: Ready for Codex

Reference Capability: CAP-001 Business Profile v1.0

Engineering Baseline: Blueprint v1.0 / Core Runtime v1.0 / Engineering Playbook v1.0

---

## Purpose

This document converts the blocked S-001 audit findings into executable implementation tasks for Codex.

The objective is to unblock the S-001 Customer Foundation audit by satisfying all mandatory audit preconditions.

---

## Current Status

S-001 audit is blocked.

Reason:

No executable S-001 implementation currently exists.

---

## Execution Order

```text
T-001 CAP-001 Cleanup-001
        |
        v
T-002 Test Runner Setup
        |
        v
T-003 Remove CRM Stub
        |
        v
T-004 Customer Domain Implementation
        |
        v
T-005 Customer Repository Implementation
        |
        v
T-006 Customer Application Service
        |
        v
T-007 Customer Events
        |
        v
T-008 Unit Tests
        |
        v
T-009 Typecheck
        |
        v
T-010 Re-open S-001 Audit
```

---

## T-001 CAP-001 Cleanup-001

### Objective

Complete the remaining CAP-001 cleanup blockers before beginning CAP-002 implementation.

### Tasks

- Delete deprecated domain/src/business/index.ts.
- Replace string-concatenated event IDs in event bus.
- Replace direct new Date().toISOString() usage in affected use cases.

### Exit Criteria

- L-002 closed.
- L-003 closed.
- L-004 closed.
- Existing package typecheck passes.

---

## T-002 Test Runner Setup

### Objective

Configure automated tests before implementing S-001.

### Decision

Use Vitest unless the repository already standardizes on another test runner.

### Tasks

- Install Vitest in affected workspace package(s).
- Add test script to package.json.
- Add minimal Vitest config if required.
- Confirm test command executes successfully.

### Suggested Script

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

### Exit Criteria

- pnpm --filter @nextshift/domain test runs.
- Test runner exits cleanly.
- No placeholder "No tests yet" script remains where S-001 tests are required.

---

## T-003 Remove CRM Stub

### Objective

Remove invalid CRM placeholder exports.

### Target File

```text
packages/domain/src/customer/index.ts
```

### Remove

- CustomerSegment
- CustomerPersona

### Rationale

CustomerPersona collides semantically with CAP-001 CustomerPersonaProfile.

CRM owns real customers, not personas.

### Exit Criteria

- Stub types removed.
- No public export exposes CustomerSegment.
- No public export exposes CRM CustomerPersona.

---

## T-004 Customer Domain Implementation

### Objective

Implement the Customer aggregate.

### Target File

```text
packages/domain/src/customer/index.ts
```

### Required Exports

- Customer
- CustomerSnapshot
- CustomerId
- CustomerName
- ContactInformation
- CustomerStatus
- CustomerType
- CommunicationPreference

### Required Fields

Customer snapshot must include:

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

### Required Behaviors

- create()
- updateProfile()
- archive()
- restore()
- toSnapshot()

### Required Invariants

- CustomerId is immutable.
- Display name is required.
- At least one contact method is required.
- Archived customers cannot be modified.
- Restored customers return to active state.

### Exit Criteria

- Customer aggregate compiles.
- Invariants enforced in domain layer.
- No application-layer business rules required.

---

## T-005 Customer Repository Implementation

### Objective

Implement the CustomerRepository contract and in-memory repository.

### Suggested Files

```text
packages/domain/src/customer/customer-repository.ts
packages/domain/src/customer/in-memory-customer-repository.ts
```

### Required Interface

- save(customer)
- findById(customerId)
- findByEmail(email)
- findByPhone(phone)
- exists(customerId)
- archive(customerId)

### Exit Criteria

- Repository interface exported.
- In-memory implementation exported.
- Repository stores Customer snapshots safely.
- Repository tests pass.

---

## T-006 Customer Application Service

### Objective

Implement application orchestration for S-001.

### Suggested File

```text
packages/application/src/customer/index.ts
```

### Required Exports

- CustomerApplicationService
- CreateCustomerCommand
- UpdateCustomerCommand
- ArchiveCustomerCommand
- RestoreCustomerCommand

### Required Operations

- createCustomer()
- updateCustomer()
- archiveCustomer()
- restoreCustomer()

### Responsibilities

- Validate command shape.
- Load Customer aggregate.
- Call domain behavior.
- Persist aggregate.
- Publish domain events.

### Constraint

Do not implement business rules in the application service.

### Exit Criteria

- Application service compiles.
- Application service uses repository contract.
- Application service emits expected events.
- Application tests pass.

---

## T-007 Customer Events

### Objective

Implement S-001 CRM domain events.

### Required Events

- CustomerCreated
- CustomerUpdated
- CustomerArchived
- CustomerRestored

### Event Metadata

Each event must include:

- eventId
- eventType
- aggregateId
- aggregateType
- occurredAt
- version
- correlationId
- causationId

### Exit Criteria

- Events exported.
- Event payloads match CAP-002 Events.md.
- Application service publishes events only after successful persistence.

---

## T-008 Unit Tests

### Objective

Write mandatory S-001 tests.

### Domain Tests

- create customer succeeds
- create customer fails without display name
- create customer fails without contact method
- update customer succeeds
- update archived customer fails
- archive customer succeeds
- restore customer succeeds

### Repository Tests

- save customer
- find by ID
- find by email
- find by phone
- exists
- archive

### Application Service Tests

- create workflow persists customer
- update workflow persists changes
- archive workflow changes status
- restore workflow changes status
- events are published

### Exit Criteria

- All tests pass.
- Tests are committed with implementation.
- No skipped mandatory tests.

---

## T-009 Typecheck

### Objective

Verify compile-time safety.

### Commands

Run:

```bash
pnpm --filter @nextshift/domain typecheck
pnpm --filter @nextshift/application typecheck
```

If package names differ, use the actual workspace package names.

### Exit Criteria

- Typecheck passes.
- No TypeScript errors.
- Public package exports compile.

---

## T-010 Re-open S-001 Audit

### Objective

Proceed to formal S-001 audit only after all preconditions are green.

### Required Evidence

Codex must provide:

- Files changed
- Tests run
- Typecheck results
- Known limitations
- Confirmation that stub exports were removed

### Exit Criteria

- CAP-002 S-001 Customer Foundation Audit may proceed.
- If audit passes, CAP-002 may move to S-002 Lead Management.

---

## Non-Negotiable Constraints

- Do not redesign runtime.
- Do not modify governance.
- Do not introduce Supabase persistence in S-001.
- Do not reintroduce CRM personas.
- Do not export placeholder domain types.
- Do not proceed to audit with failed preconditions.
- Do not mark S-001 complete without tests.

---

## Final Delivery Format for Codex

Codex should return:

```text
CAP-002 S-001 Implementation Report

Files changed:
- ...

Tests:
- ...

Typecheck:
- ...

Preconditions:
1. CAP-001 Cleanup-001 completed - PASS/FAIL
2. Customer stub removed - PASS/FAIL
3. Customer aggregate implemented - PASS/FAIL
4. Repository implemented - PASS/FAIL
5. Application service implemented - PASS/FAIL
6. Domain events implemented - PASS/FAIL
7. Tests completed - PASS/FAIL
8. Typecheck completed - PASS/FAIL

Known limitations:
- ...

Ready for audit:
YES/NO
```

---

## Status

Ready for Codex implementation.
