# Reference Implementations

Version: 1.0

Status: Frozen

Last Updated: 2026-07-09

---

## Purpose

Runtime Platform v1.0 is frozen after two validated adapter implementations.

These implementations are the reference pattern for future adapters.

---

## Revenue Runtime Adapter

Reference docs:

- [Pilot 1 Implementation Report](../runtime-pilot-1/IMPLEMENTATION_REPORT.md)
- [Pilot 1 Code Review Report](../runtime-pilot-1/CODE_REVIEW_REPORT.md)

Implemented source boundaries:

- `src/modules/revenue-drivers/runtime/RevenueRuntimeAdapter.ts`
- `src/modules/revenue-drivers/runtime/runtime-revenue-flag.ts`
- `src/modules/revenue-drivers/runtime/index.ts`
- `src/modules/revenue-drivers/components/RevenueDriverIntentResolver.tsx`
- `src/__tests__/services/revenue-runtime-adapter.test.ts`

Feature flag:

```text
NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE
```

Reference behavior:

- flag OFF preserves legacy revenue driver resolution
- flag ON creates runtime context, capability, event, diagnostics, and safe metadata
- runtime failure falls back to legacy resolution
- fallback logging uses safe classification only
- UI-facing runtime metadata excludes tenant and user identifiers

---

## Analytics Runtime Adapter

Reference docs:

- [Pilot 2 Implementation Report](../runtime-pilot-2-analytics/IMPLEMENTATION_REPORT.md)

Implemented source boundaries:

- `src/modules/analytics/runtime/AnalyticsRuntimeAdapter.ts`
- `src/modules/analytics/runtime/runtime-analytics-flag.ts`
- `src/modules/analytics/runtime/index.ts`
- `src/modules/analytics/analyticsService.ts`
- `src/__tests__/services/analytics-runtime-adapter.test.ts`

Feature flag:

```text
NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS
```

Reference behavior:

- flag missing or non-`true` preserves legacy analytics behavior
- flag ON enables the analytics runtime adapter path
- runtime construction failure falls back to legacy analytics projection
- invalid runtime output falls back to legacy analytics projection
- fallback warnings are safe
- returned runtime metadata excludes tenant and user identifiers

---

## Shared Reference Pattern

Both reference implementations prove the same platform pattern:

```text
Caller
  |
  v
Runtime Adapter
  |
  v
Feature Flag
  |
  v
Runtime
  |
  v
Legacy Fallback
```

The adapter owns feature flag evaluation, runtime routing, fallback decisions, safe logging, and safe metadata.

---

## Future Adapter Baseline

Future Dashboard, CRM, Business Brain, and Decision Brain adapters must start from these reference implementations and the [Runtime Adapter Standard v1.0](../runtime-standard/README.md).
