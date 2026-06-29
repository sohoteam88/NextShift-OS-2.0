## CAP-002 S-002 Lead Management Implementation Tasks

Version: v1.0

Capability: CAP-002 CRM

Implementation Slice: S-002 Lead Management

Status: Ready for Codex

Prerequisite:

- CAP-002 S-001 Customer Foundation - PASS

Reference Capability:

- CAP-001 Business Profile v1.0 (Frozen)

Engineering Baseline:

- Blueprint v1.0
- Core Runtime v1.0
- Engineering Playbook v1.0

---

## Purpose

This document converts the approved S-002 Build Specification into executable implementation tasks.

The objective is to implement the Lead aggregate and lifecycle while reusing the Customer Foundation delivered in S-001.

---

## Execution Order

```text
T-001 Lead Domain
        |
        v
T-002 Lead Repository
        |
        v
T-003 Lead Application Service
        |
        v
T-004 Lead -> Customer Conversion
        |
        v
T-005 Lead Events
        |
        v
T-006 Unit Tests
        |
        v
T-007 Typecheck
        |
        v
T-008 Verification
        |
        v
T-009 Audit
```

---

## T-001 Lead Domain

### Objective

Implement the Lead aggregate.

### Required Files

Suggested:

```text
packages/domain/src/lead/index.ts
```

### Required Types

- Lead
- LeadSnapshot
- LeadId
- LeadSource
- LeadStatus
- QualificationScore

### Required Behaviors

- create()
- update()
- qualify()
- convert()
- close()
- toSnapshot()

### Required Invariants

- LeadId immutable
- Display name required
- Contact information required
- Qualified once
- Converted once
- Closed is terminal
- Converted leads cannot be modified

---

## T-002 Lead Repository

Implement:

- LeadRepository interface
- InMemoryLeadRepository

Required operations:

- save()
- findById()
- findByEmail()
- findByPhone()
- exists()
- close()

Repository remains persistence-agnostic.

---

## T-003 Lead Application Service

Implement:

```text
packages/application/src/lead/index.ts
```

Operations:

- createLead()
- updateLead()
- qualifyLead()
- convertLead()
- closeLead()

Responsibilities:

- Validate commands
- Load aggregate
- Invoke domain behavior
- Persist Lead
- Publish events

Business rules remain inside the Lead aggregate.

---

## T-004 Lead -> Customer Conversion

### Objective

Reuse S-001 Customer Foundation.

Required workflow:

1. Load qualified Lead
2. Verify Lead state
3. Create Customer using CustomerApplicationService
4. Persist Customer
5. Mark Lead converted
6. Persist Lead
7. Publish LeadConverted event

Do not duplicate Customer creation logic.

---

## T-005 Domain Events

Implement:

- LeadCreated
- LeadUpdated
- LeadQualified
- LeadConverted
- LeadClosed

Each event must implement the standard CRM event metadata contract.

---

## T-006 Unit Tests

### Aggregate

Required tests:

- create lead
- update lead
- qualify lead
- convert lead
- close lead
- prevent double conversion
- prevent update after conversion

### Repository

Required tests:

- save
- find by ID
- find by email
- find by phone
- exists
- close

### Application

Required tests:

- create workflow
- qualify workflow
- convert workflow
- close workflow
- event publication
- customer created during conversion
- conversion cannot create duplicate customers

---

## T-007 Typecheck

Run:

```bash
pnpm --filter @nextshift/domain typecheck
pnpm --filter @nextshift/application typecheck
```

Requirements:

- Zero TypeScript errors
- S-001 regression tests remain green

---

## T-008 Verification

Complete:

- Implementation Report
- Verification Checklist

Confirm:

- All Build Specification requirements satisfied
- Tests passing
- Typecheck passing
- Public API updated

---

## T-009 Audit Readiness

Do not request audit until all of the following are true:

- Lead aggregate implemented
- Repository implemented
- Application service implemented
- Lead conversion validated
- Domain events implemented
- Tests passing
- Typecheck passing
- Documentation updated

Deliverables:

- Implementation Report
- Verification Checklist
- Files changed summary
- Test results
- Typecheck results

---

## Constraints

- Reuse S-001 Customer APIs.
- No duplicate Customer logic.
- No runtime redesign.
- No governance changes.
- No persistence technology coupling.
- No breaking changes to S-001 public API.
- Preserve all S-001 regression tests.

---

## Success Criteria

S-002 is complete when:

- Lead lifecycle is operational.
- Qualified Lead converts into exactly one Customer.
- All Lead events are published correctly.
- Unit tests pass.
- Typecheck passes.
- S-001 remains fully compatible.

Status:

```text
Ready for Codex Implementation
```
