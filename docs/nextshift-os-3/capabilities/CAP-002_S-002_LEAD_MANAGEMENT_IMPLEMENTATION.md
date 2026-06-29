## CAP-002 S-002 Lead Management Implementation

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-002 Lead Management

Status: Complete

Prerequisites:

- CAP-002 S-001 Customer Foundation - PASS
- CAP-002 S-002 Build Specification - Approved
- CAP-002 S-002 Implementation Tasks - Approved

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.0

---

## Purpose

This document defines the implementation execution plan for the Lead Management slice.

Implementation must follow the approved Build Specification and Implementation Tasks without introducing architectural or governance changes.

---

## Objectives

Deliver the following capabilities:

- Lead aggregate
- Lead lifecycle management
- Lead qualification
- Lead conversion
- Lead repository
- Lead application service
- Lead domain events
- Automated tests

---

## Work Packages

### WP-001 Domain Layer

Implement:

- Lead aggregate
- Lead entity
- Lead value objects
- Aggregate invariants

Required files, suggested:

```text
packages/domain/src/lead/index.ts
```

Completion Criteria:

- Aggregate compiles.
- Invariants enforced.
- Public exports updated.

---

### WP-002 Repository Layer

Implement:

- LeadRepository
- InMemoryLeadRepository

Repository responsibilities:

- Persist Lead snapshots.
- Retrieve Lead aggregates.
- Support conversion lifecycle.

Completion Criteria:

- Repository interface complete.
- In-memory implementation complete.

---

### WP-003 Application Layer

Implement:

```text
packages/application/src/lead/index.ts
```

Application service:

- LeadApplicationService

Supported operations:

- createLead()
- updateLead()
- qualifyLead()
- convertLead()
- closeLead()

Completion Criteria:

- Commands orchestrate domain correctly.
- No business rules outside the aggregate.

---

### WP-004 Lead Conversion

Implement Lead to Customer conversion.

Workflow:

1. Load Lead.
2. Verify Qualified status.
3. Invoke CustomerApplicationService.
4. Persist Customer.
5. Mark Lead converted.
6. Persist Lead.
7. Publish events.

Constraint:

Customer creation logic must remain exclusively inside S-001 Customer Foundation.

---

### WP-005 Domain Events

Implement:

- LeadCreated
- LeadUpdated
- LeadQualified
- LeadConverted
- LeadClosed

Events must follow the CAP-002 event metadata contract.

---

### WP-006 Public API

Export:

- Lead
- LeadRepository
- InMemoryLeadRepository
- LeadApplicationService
- Commands
- Queries
- Events
- Value Objects

Do not introduce breaking changes to S-001 exports.

---

### WP-007 Tests

Domain tests:

- Create Lead
- Update Lead
- Qualify Lead
- Convert Lead
- Close Lead
- Prevent duplicate conversion
- Prevent invalid state transitions

Repository tests:

- Save
- Retrieve
- Exists
- Close

Application tests:

- Create workflow
- Qualification workflow
- Conversion workflow
- Event publication
- Customer creation integration

Regression:

All S-001 tests must continue to pass.

---

### WP-008 Validation

Run:

```bash
pnpm --filter @nextshift/domain test
pnpm --filter @nextshift/application test

pnpm --filter @nextshift/domain typecheck
pnpm --filter @nextshift/application typecheck
```

Success Criteria:

- All tests pass.
- Typecheck passes.
- No S-001 regressions.

---

## Deliverables

Implementation must produce:

- Lead aggregate
- Lead repository
- Lead application service
- Lead events
- Test suites
- Updated package exports

Documentation generated after implementation:

- S-002 Implementation Report
- S-002 Verification Checklist
- S-002 Audit
- S-002 Release Notes

---

## Constraints

- Reuse Customer Foundation.
- No duplicate Customer logic.
- No runtime redesign.
- No governance changes.
- No persistence technology changes.
- Preserve backward compatibility.

---

## Completion Criteria

Implementation is complete when:

- All work packages complete.
- Tests pass.
- Typecheck passes.
- Public API updated.
- Documentation prepared for verification.

Implementation Status:

- [ ] Not Started
- [ ] In Progress
- [x] Complete

---

## Next Phase

After implementation completes:

1. CAP-002 S-002 Lead Management Implementation Report
2. CAP-002 S-002 Lead Management Verification Checklist
3. CAP-002 S-002 Lead Management Audit
4. CAP-002 S-002 Lead Management Release Notes
