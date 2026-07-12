# OS 3.3 Runtime Pilot 1 Execution Task

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-1`

---

## Task Purpose

This document is the executable task for a later implementation phase.

Do not execute this task in the planning branch.

---

## Future Branch

Recommended future branch:

```text
fix/os-3.3-runtime-revenue-pilot
```

Base branch:

```text
planning/os-3.3-runtime-platform
```

---

## Goal

Implement the Revenue Drivers Runtime Capability Adapter behind a default-OFF feature flag.

Feature flag:

```text
retiredRevenueRuntimeFlag
```

Default:

```text
OFF
```

Runtime must not affect existing behavior when OFF.

---

## Allowed Future Files

The future implementation should be limited to:

- `src/modules/revenue-drivers/runtime/RevenueRuntimeAdapter.ts`
- `src/modules/revenue-drivers/runtime/index.ts`
- `src/modules/revenue-drivers/runtime/retired-revenue-flag-helper.ts`
- `src/modules/revenue-drivers/components/RevenueDriverIntentResolver.tsx`
- `src/__tests__/services/revenue-runtime-adapter.test.ts`
- `src/__tests__/services/revenue-drivers.test.ts` only if regression expectations must be expanded

Optional only if needed:

- a module-local logger helper under `src/modules/revenue-drivers/runtime/`

---

## Forbidden Future Files

Do not modify:

- Prisma schema or migrations.
- env files.
- deployment files.
- CI workflows.
- package manager lockfiles unless a dependency change is explicitly approved.
- dashboard modules.
- analytics modules.
- business-brain package.
- decision-brain package.
- runtime package internals unless a separate runtime contract gap is proven.

---

## Implementation Steps

1. Confirm base branch is latest.
2. Create implementation branch from `origin/planning/os-3.3-runtime-platform`.
3. Add module-local feature flag helper.
4. Add `RevenueRuntimeAdapter`.
5. Keep existing `resolveRevenueDriverIntent` as the source of truth.
6. When flag is OFF, return legacy resolver output plus `runtime.enabled: false`.
7. When flag is ON, create runtime context using `@nextshift/runtime`.
8. When flag is ON, create runtime capability identity for `revenue.driver.intent.resolve`.
9. Map resolver status to runtime event type.
10. Create runtime diagnostics for healthy, invalid, fallback, and degraded paths.
11. Catch runtime construction errors and return legacy resolver output with degraded runtime metadata.
12. Update `RevenueDriverIntentResolver.tsx` to call the adapter without changing user-visible output.
13. Keep existing audit fetch behavior non-blocking.
14. Add adapter tests.
15. Run full validation.

---

## Required Runtime Mappings

Capability identity:

```text
capabilityId: revenue.driver.intent.resolve
kind: workflow
version: 1.0.0
```

Event types:

```text
runtime.revenue.intent.resolved
runtime.revenue.intent.invalid
runtime.revenue.intent.fallback
runtime.revenue.adapter.degraded
```

Diagnostics:

```text
diagnosticsId: revenue-runtime-adapter
component: revenue-drivers
scope: capability
```

---

## Required Tests

Create:

```text
src/__tests__/services/revenue-runtime-adapter.test.ts
```

Test cases:

- OFF flag returns legacy output and no runtime IDs.
- ON flag returns resolved output with runtime IDs and event type.
- ON flag returns invalid output with `runtime.revenue.intent.invalid`.
- ON flag returns fallback output with `runtime.revenue.intent.fallback`.
- Runtime failure returns legacy output and degraded diagnostics.
- Runtime metadata does not contain forbidden secret-like keys.

Do not remove existing tests from:

```text
src/__tests__/services/revenue-drivers.test.ts
```

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
```

---

## Required Report After Future Implementation

Return:

1. Feature flag behavior.
2. Adapter files changed.
3. Tests added or updated.
4. Validation results.
5. Git status.
6. Commit hash.
7. PR readiness.

---

## Stop Rule

Stop after Pilot 1 implementation.

Do not start Analytics Runtime Integration.

Do not start Dashboard Runtime Integration.

Do not create tag.

Do not merge without explicit approval.
