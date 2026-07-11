# OS 3.3 Runtime Pilot 2 Analytics Overview

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-2-analytics`

---

## Purpose

Design the second OS 3.3 Runtime Integration pilot using [Runtime Adapter Standard v1.0](../runtime-standard/README.md).

This is a planning-only deliverable. It does not authorize implementation, runtime code changes, production code changes, CI changes, Prisma changes, env changes, deployment changes, tags, or merge.

---

## Pilot Target

Pilot 2 target:

```text
Analytics Runtime Adapter
```

The adapter should start with the analytics projection seam, not a storage rewrite or full dashboard rewrite.

Primary future module boundary:

```text
src/modules/analytics/runtime/
```

Recommended future entry point:

```text
AnalyticsRuntimeAdapter
```

---

## Source References

This plan follows:

- [Runtime Adapter Standard](../runtime-standard/RUNTIME_ADAPTER_STANDARD.md)
- [Feature Flag Standard](../runtime-standard/FEATURE_FLAG_STANDARD.md)
- [Fallback Standard](../runtime-standard/FALLBACK_STANDARD.md)
- [Metadata Contract](../runtime-standard/METADATA_CONTRACT.md)
- [Observability Standard](../runtime-standard/OBSERVABILITY_STANDARD.md)
- [Testing Standard](../runtime-standard/TESTING_STANDARD.md)
- [Code Review Checklist](../runtime-standard/CODE_REVIEW_CHECKLIST.md)
- [Architecture Checklist](../runtime-standard/ARCHITECTURE_CHECKLIST.md)
- [Migration Guide](../runtime-standard/MIGRATION_GUIDE.md)
- [Pilot 1 Overview](../runtime-pilot-1/PILOT_OVERVIEW.md)
- [Pilot 1 Implementation Contract](../runtime-pilot-1/IMPLEMENTATION_CONTRACT.md)
- [Pilot 1 Architecture](../runtime-pilot-1/ARCHITECTURE.md)
- [Pilot 1 Data Flow](../runtime-pilot-1/DATA_FLOW.md)
- [Pilot 1 Acceptance Criteria](../runtime-pilot-1/ACCEPTANCE_CRITERIA.md)
- [Pilot 1 Code Review Report](../runtime-pilot-1/CODE_REVIEW_REPORT.md)
- [Pilot 1 Implementation Report](../runtime-pilot-1/IMPLEMENTATION_REPORT.md)

---

## Current Repository Evidence

Current analytics surfaces include:

- `src/app/(auth)/analytics/page.tsx`
- `src/app/api/v1/analytics/member/route.ts`
- `src/app/api/v1/analytics/leader/route.ts`
- `src/app/api/v1/analytics/operator/route.ts`
- `src/app/api/v1/analytics-center/route.ts`
- `src/modules/analytics/services/analytics-service.ts`
- `src/modules/analytics/analyticsService.ts`
- `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts`
- `src/modules/analytics/telemetry/analytics-telemetry.ts`
- `packages/application/src/analytics/analytics-application-service.ts`
- `packages/domain/src/analytics/`

Existing focused test evidence:

- `src/__tests__/services/analytics-projection-adapter.test.ts`

---

## Recommended Pilot Cut

Pilot 2 should wrap the analytics projection path first:

```text
Analytics Center Trigger
  |
  v
Analytics Projection Adapter
  |
  v
Business State / Journey State / Growth Loop projections
  |
  v
Analytics Center output
```

This is preferred because:

- It is narrower than member, leader, and operator dashboard aggregation.
- It already has a deterministic projection adapter.
- It already has focused tests.
- It already consumes application and domain-facing analytics concepts.
- It avoids first-pass Prisma query rewrites.
- It preserves existing analytics dashboard behavior when the flag is OFF.

---

## Target Flow

Pilot 2 must follow the standard runtime adapter flow:

```text
UI / Analytics Trigger
  |
  v
Analytics Runtime Adapter
  |
  v
Runtime
  |
  v
Application
  |
  v
Domain
```

The adapter must add runtime context, capability metadata, diagnostics, and safe observability metadata beside the legacy analytics projection output.

---

## Feature Flag

Flag:

```text
retiredAnalyticsRuntimeFlag
```

Default:

```text
OFF
```

Rules:

- Only exact `true` enables the analytics runtime adapter path.
- Missing, empty, `false`, `FALSE`, `True`, `1`, `0`, and other values are OFF.
- OFF preserves existing analytics behavior.
- ON enables only the analytics runtime adapter path.
- Runtime failure falls back to legacy analytics behavior.
- No env files are modified in the first implementation pass.

---

## Pilot Acceptance Summary

Planning is accepted when:

- Current analytics flow is documented.
- Target runtime flow is documented.
- Adapter, runtime, legacy service, application, and domain responsibilities are documented.
- Feature flag, fallback, safe metadata, observability, tests, rollback, and review checklists are documented.
- Explicit out-of-scope items are documented.
- No production code is changed.
- No CI, Prisma, env, deployment, tag, merge, or Pilot 3 work is performed.
