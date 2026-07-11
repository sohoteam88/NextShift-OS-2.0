# OS 3.3 Runtime Pilot 1 Acceptance Criteria

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-1`

---

## Planning Acceptance Criteria

This planning phase is accepted when:

- Pilot target is documented as Revenue Drivers Runtime Capability Adapter.
- Current flow and target flow are documented.
- Runtime responsibilities are documented.
- Adapter responsibilities are documented.
- Feature flag strategy is documented.
- Rollback strategy is documented.
- Error handling is documented.
- Observability, logging, metrics, and testing strategy are documented.
- Implementation task is executable by Codex without unresolved architectural decisions.
- No production code is changed.
- No CI, Prisma, env, deployment, tag, or merge change is made.

---

## Future Implementation Acceptance Criteria

The future implementation is accepted only when all criteria below are met.

### Feature Flag

- `retiredRevenueRuntimeFlag` exists as the runtime revenue flag.
- Default is OFF.
- OFF preserves current behavior.
- ON activates the Revenue Runtime Adapter path.
- Any non-`true` value is treated as OFF.
- No env files are required to change in the first implementation pass.

### User Behavior

- Existing Revenue Driver hierarchy remains ordered.
- Existing action hrefs remain valid.
- Existing deep-link intent behavior remains valid.
- Existing invalid intent behavior remains valid.
- Existing fallback behavior remains valid.
- Existing UI translation keys remain valid.
- Existing audit behavior remains non-blocking.

### Runtime Behavior

- Runtime context is created only when flag is ON.
- Runtime capability identity is created only when flag is ON.
- Runtime event type is deterministic.
- Runtime diagnostics are produced for healthy or degraded adapter execution.
- Runtime metadata contains no secret-like keys.
- Runtime errors degrade to legacy behavior.

### Adapter Behavior

- Adapter uses existing resolver as the source of truth.
- Adapter does not import Prisma.
- Adapter does not import Next.js request/response objects.
- Adapter does not perform auth checks.
- Adapter does not write audit logs.
- Adapter does not change route definitions.
- Adapter does not change intent aliases.
- Adapter does not change translation keys.

### Observability

- Runtime-enabled output exposes `correlationId`.
- Runtime-enabled output exposes `contextId`.
- Runtime-enabled output exposes `capabilityId`.
- Runtime-enabled output exposes `eventType`.
- Runtime-enabled output exposes diagnostics status.
- Logs use only safe normalized fields.

### Metrics

- Resolved, invalid, fallback, disabled, and degraded outcomes can be counted.
- Metric dimensions are low cardinality.
- Raw user-generated text is not used as a metric dimension.

### Rollback

- Setting `retiredRevenueRuntimeFlag` to OFF disables runtime behavior.
- No database rollback is required.
- No deployment topology rollback is required.
- Existing legacy resolver remains available.

---

## Required Tests For Future Implementation

Future implementation must include tests for:

- Flag OFF returns legacy resolver output.
- Flag ON resolved intent returns runtime metadata.
- Flag ON invalid intent returns runtime metadata with invalid event.
- Flag ON missing intent returns runtime metadata with fallback event.
- Runtime constructor failure returns legacy output with degraded diagnostics.
- Metadata avoids forbidden secret-like keys.
- Existing Revenue Driver tests remain green.

Recommended test file:

```text
src/__tests__/services/revenue-runtime-adapter.test.ts
```

Existing regression test file:

```text
src/__tests__/services/revenue-drivers.test.ts
```

---

## Required Validation For Future Implementation

Future implementation must run:

```bash
pnpm type-check
pnpm test
pnpm -r --filter './packages/*' test
pnpm docs:links
git diff --check
git diff --cached --check
```

---

## Planning Validation

This planning branch must run:

```bash
pnpm docs:links
pnpm docs:navigation
git diff --check
git diff --cached --check
```

---

## Explicit Rejection Criteria

Reject future implementation if it:

- Changes Prisma schema.
- Modifies env files.
- Modifies deployment configuration.
- Changes CI.
- Requires runtime path while the flag is OFF.
- Changes user-visible Revenue Driver behavior without explicit approval.
- Imports Prisma into the adapter.
- Makes runtime errors fatal to the UI.
- Stores tokens, passwords, API keys, credentials, cookies, or raw headers in runtime metadata.
