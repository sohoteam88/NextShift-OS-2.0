## CAP-005 S-002 Planning

Status: Planning

Capability: CAP-005 Revenue

Slice: S-002 Revenue Application Foundation

---

## Objective

Build the application layer for the Revenue capability by introducing the application service responsible for creating, updating lifecycle state, archiving, and querying Revenue aggregates through the repository abstraction established in S-001.

This slice exposes the first application API while keeping forecasting, analytics, reporting, and automation out of scope.

---

## Functional Scope

Implement:

- RevenueApplicationService
- Revenue creation workflow
- Revenue recording workflow
- Revenue recognition workflow
- Revenue archival workflow
- Revenue retrieval by ID
- Revenue retrieval by business
- Revenue search workflow
- Application exports
- Application unit tests

Do not implement:

- Forecast generation
- Revenue analytics
- KPI calculations
- Dashboard queries
- Recommendation engine
- Scheduled processing
- External accounting integrations

These belong to later slices.

---

## Application Deliverables

Create:

```text
packages/application/src/revenue/
```

Typical artifacts:

- `revenue-application-service.ts`
- `index.ts`

Update:

```text
packages/application/src/index.ts
```

---

## Domain Dependencies

Reuse without modification:

- Revenue aggregate
- RevenueRepository
- InMemoryRevenueRepository
- Revenue domain events
- Shared Result model

No domain redesign is permitted.

---

## Tests

Create:

```text
packages/application/test/revenue-application-service.test.ts
```

Coverage should verify:

- Create revenue
- Record revenue
- Recognize revenue
- Archive revenue
- Retrieve by ID
- Retrieve by business
- Search by criteria
- Error handling for missing aggregates
- Invalid lifecycle transition propagation

---

## Verification Criteria

- Application tests PASS
- Existing application tests PASS
- Domain regression tests PASS
- Typecheck PASS
- Public exports verified
- No breaking changes

---

## Dependencies

Requires completion of:

- CAP-005 S-001 Revenue Domain Foundation

No additional framework dependencies.

---

## Exit Criteria

S-002 is complete when:

- RevenueApplicationService implemented
- Application tests passing
- Typecheck passing
- Public exports complete
- Ready for advanced Revenue features in S-003

---

## Next Phase

```text
CAP-005 S-002 Implementation
```
