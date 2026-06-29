## CAP-005 S-004 Planning

Status: Planning

Capability: CAP-005 Revenue

Slice: S-004 Revenue Progress Tracking

---

## Objective

Implement progress tracking between Revenue and RevenueTarget.

This slice introduces domain services and application workflows that calculate current progress toward defined revenue targets using recorded revenue. It provides the operational foundation for future forecasting, dashboards, recommendations, and analytics.

---

## Functional Scope

Implement:

- RevenueProgress domain model
- RevenueProgressCalculator domain service
- Revenue progress value objects
- Revenue progress application service
- Progress query workflows
- Progress summary generation
- Public exports
- Domain and application unit tests

Do not implement:

- Forecasting
- Predictive analytics
- AI recommendations
- Dashboard rendering
- Scheduled recalculation
- Notifications
- External BI integrations

These belong to later slices.

---

## Domain Deliverables

Create:

```text
packages/domain/src/revenue-progress/
```

Typical artifacts:

- `revenue-progress.ts`
- `revenue-progress-calculator.ts`
- `index.ts`

Update:

```text
packages/domain/src/index.ts
```

---

## Application Deliverables

Create:

```text
packages/application/src/revenue-progress/
```

Typical artifacts:

- `revenue-progress-application-service.ts`
- `index.ts`

Update:

```text
packages/application/src/index.ts
```

---

## Functional Workflows

Application service shall support:

- Calculate Revenue Progress
- Get Revenue Progress by Target
- List Revenue Progress by Business
- Compare Revenue against Target
- Generate Progress Summary

The calculator must reuse Revenue and RevenueTarget as authoritative sources. No progress state is persisted in this slice.

---

## Domain Rules

The calculator shall:

- Match revenue records to active targets
- Aggregate recognized revenue within the target period
- Calculate:
  - Target Amount
  - Recognized Revenue
  - Remaining Amount
  - Achievement Percentage
- Prevent negative remaining amounts
- Preserve currency consistency
- Reject incompatible comparisons

No forecasting logic is permitted.

---

## Tests

Create:

Domain:

```text
packages/domain/test/revenue-progress.test.ts
```

Application:

```text
packages/application/test/revenue-progress-application-service.test.ts
```

Coverage should verify:

- Progress calculation
- Currency validation
- Period validation
- Empty revenue handling
- Full target achievement
- Over-achievement handling
- Business isolation
- Public exports

---

## Verification Criteria

- Domain tests PASS
- Application tests PASS
- Existing regression suites PASS
- Typecheck PASS
- Public exports verified
- No breaking changes

---

## Dependencies

Requires:

- CAP-005 S-001 Revenue Domain Foundation
- CAP-005 S-002 Revenue Application Foundation
- CAP-005 S-003 Revenue Target Management

No runtime or governance modifications are permitted.

---

## Exit Criteria

S-004 is complete when:

- RevenueProgress calculator implemented
- Progress application service implemented
- Progress queries operational
- Tests passing
- Typecheck passing
- Public exports verified
- Ready for Revenue Forecasting in S-005

---

## Next Phase

```text
CAP-005 S-004 Implementation
```
