## CAP-002 CRM Pre-Implementation Resolution

Version: v1.0

Status: Approved for Implementation Planning

---

## Overall Status

The CRM capability specification is complete.

Implementation has not started.

Current capability state:

- Definition: Complete
- Domain Model: Complete
- Use Cases: Complete
- Events: Complete
- Application Specification: Complete
- Implementation Slices: Complete
- Slice Audits: Blocked
- Capability Audit: Blocked
- Release: Blocked

---

## Resolution R-001

### Customer Stub Replacement

Current file:

```text
packages/domain/src/customer/index.ts
```

contains temporary placeholder types.

These placeholder types are not part of the approved CRM domain model.

Required action:

- Remove CustomerSegment.
- Remove CustomerPersona.
- Replace the file with the S-001 Customer aggregate implementation.

No placeholder domain types shall remain after S-001 begins.

---

## Resolution R-002

### Canonical Domain Ownership

Customer personas belong exclusively to CAP-001 Business Profile.

CRM owns real customer records.

Domain ownership is therefore:

| Concept | Capability |
| --- | --- |
| CustomerPersonaProfile | CAP-001 |
| Customer Aggregate | CAP-002 |
| Lead | CAP-002 |
| Interaction | CAP-002 |
| FollowUp | CAP-002 |
| Segment | CAP-002 |

No duplicate persona model shall exist inside CRM.

---

## Resolution R-003

### Application Service Architecture

CAP-002 adopts the multi-service application architecture defined in its specification.

Application service boundaries:

- CustomerApplicationService
- LeadApplicationService
- InteractionApplicationService
- FollowUpApplicationService
- SegmentApplicationService

Each service shall expose its own contract interface.

No monolithic CRM application contract will be introduced.

---

## Resolution R-004

### Repository Strategy

CAP-002 Phase 1 follows the same implementation strategy as CAP-001.

Repository implementations shall use an in-memory persistence adapter during bootstrap.

Repository interfaces remain stable.

Future persistence adapters, such as Supabase, may replace the implementation without changing the domain or application layers.

The S-001 audit checklist shall therefore evaluate:

- Repository interface completeness
- Repository implementation correctness

rather than requiring production database infrastructure.

---

## Resolution R-005

### Testing Standard

Unlike CAP-001, all CAP-002 slices require automated tests.

Minimum requirements for every slice:

- Unit tests
- Type checking
- Aggregate invariant tests
- Application service tests
- Repository tests for the in-memory implementation

Integration tests remain optional until external infrastructure is introduced.

---

## Updated Preconditions for S-001

| # | Requirement | Status |
| --- | --- | --- |
| 1 | CAP-001 Cleanup-001 completed | Pending |
| 2 | Customer stub removed | Pending |
| 3 | Customer aggregate implemented | Pending |
| 4 | CustomerRepository interface and in-memory implementation completed | Pending |
| 5 | CustomerApplicationService completed | Pending |
| 6 | Customer domain events implemented | Pending |
| 7 | Unit tests passing | Pending |
| 8 | Type checking passing | Pending |

---

## Go / No-Go Decision

Current Decision:

```text
NO-GO
```

Reason:

Implementation has not yet started.

The first executable milestone is:

```text
S-001 Customer Foundation
```

Successful completion and audit of S-001 will unlock the remaining implementation slices.
