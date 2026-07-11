# OS 3.3 Runtime Pilot 2 Analytics Execution Task

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-2-analytics`

---

## Task For Future Implementation

Implement the Analytics Runtime Adapter using Runtime Adapter Standard v1.0.

Base branch for future implementation:

```text
planning/os-3.3-runtime-platform
```

Recommended future branch:

```text
feature/os-3.3-runtime-analytics-adapter
```

---

## Goal

Implement a narrow runtime integration pilot:

```text
Analytics Runtime Adapter
```

Target flow:

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

Legacy analytics behavior must remain unchanged when the feature flag is OFF.

---

## Feature Flag

Use:

```text
retiredAnalyticsRuntimeFlag
```

Default:

```text
OFF
```

Only exact `true` enables runtime behavior.

---

## Implementation Scope

Implement only the analytics projection runtime adapter path.

Allowed:

- Add `src/modules/analytics/runtime/AnalyticsRuntimeAdapter.ts`.
- Add `src/modules/analytics/runtime/retired-analytics-flag-helper.ts`.
- Add `src/modules/analytics/runtime/index.ts`.
- Route the analytics-center projection path through the adapter only when the flag is ON.
- Preserve legacy projection output.
- Add safe fallback to legacy projection output if runtime construction fails.
- Add focused unit tests.
- Update only directly relevant implementation report documentation after implementation.

Forbidden:

- Do not integrate Dashboard Projection Runtime.
- Do not rewrite member, leader, or operator dashboard aggregation.
- Do not integrate Business Brain.
- Do not integrate Decision Brain.
- Do not modify Prisma schema.
- Do not modify env files.
- Do not modify deployment config.
- Do not modify CI.
- Do not create tag.
- Do not perform broad refactor.
- Do not start Pilot 3.

---

## Required Implementation Steps

1. Read this planning package.
2. Read [Runtime Adapter Standard](../runtime-standard/RUNTIME_ADAPTER_STANDARD.md).
3. Read [Feature Flag Standard](../runtime-standard/FEATURE_FLAG_STANDARD.md).
4. Read [Fallback Standard](../runtime-standard/FALLBACK_STANDARD.md).
5. Read [Metadata Contract](../runtime-standard/METADATA_CONTRACT.md).
6. Read [Observability Standard](../runtime-standard/OBSERVABILITY_STANDARD.md).
7. Read [Testing Standard](../runtime-standard/TESTING_STANDARD.md).
8. Inspect `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts`.
9. Inspect `src/modules/analytics/analyticsService.ts`.
10. Add module-local runtime folder.
11. Add feature flag helper.
12. Add analytics runtime adapter.
13. Use `@nextshift/runtime`.
14. Use dependency injection for runtime factories and logger.
15. Preserve legacy analytics projection output.
16. Add fallback on runtime failure.
17. Add safe runtime metadata.
18. Add focused tests.
19. Run full validation.

---

## Required Adapter Behavior

Flag OFF:

- call legacy analytics projection resolver
- return legacy projection output
- return runtime metadata with `enabled: false`, `mode: legacy`, `fallback: false`
- do not require runtime IDs

Flag ON:

- call legacy analytics projection resolver
- create runtime context
- create runtime capability
- create runtime event
- create runtime diagnostics
- return legacy projection output plus runtime metadata
- set `mode: runtime`
- set `fallback: false`
- include context, correlation, capability, event, and diagnostics metadata

Runtime failure:

- catch with `catch (error)`
- classify only safe `errorKind`
- log only safe fallback warning fields
- return legacy projection output
- return runtime metadata with `enabled: true`, `mode: legacy`, `fallback: true`, `diagnosticsStatus: degraded`

---

## Required Tests

Add:

```text
src/__tests__/services/analytics-runtime-adapter.test.ts
```

Tests must cover:

- missing flag is OFF
- `false`, `FALSE`, `True`, `1`, `0`, and empty string are OFF
- exact `true` is ON
- flag OFF uses legacy projection path
- flag ON uses runtime adapter path
- runtime construction failure falls back to legacy projection path
- incomplete runtime output falls back to legacy projection path
- adapter exposes source, runtime, fallback, confidence, context, correlation, event, and diagnostics metadata when available
- UI-facing metadata excludes tenant ID and user ID
- fallback warnings exclude tenant ID and user ID
- fallback warnings exclude raw error messages and stack traces
- existing `analytics-projection-adapter` tests remain green

---

## Required Validation

Run:

```bash
pnpm type-check
pnpm test
pnpm -r --filter './packages/*' test
pnpm docs:links
git diff --check
git diff --cached --check
git tag --points-at HEAD
```

---

## Implementation Report

Future implementation should create:

```text
docs/nextshift-os-3/runtime-pilot-2-analytics/IMPLEMENTATION_REPORT.md
```

Include:

- implemented files
- flow summary
- feature flag behavior
- fallback behavior
- metadata boundary
- observability behavior
- tests added
- validation results
- known limitations

---

## Stop Condition

Stop after future implementation and commit.

Do not merge.

Do not create tag.

Do not start Pilot 3.
