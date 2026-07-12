# OS 3.3 Runtime Pilot 1 Architecture

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-1`

---

## Architecture Decision

Pilot 1 will introduce a thin Revenue Runtime Adapter in a later implementation phase.

The adapter will sit between Revenue Driver UI surfaces and existing Revenue Driver intent resolution. It will use runtime primitives only when the feature flag is ON.

---

## Current Architecture

Required current flow:

```text
UI
  |
  v
Business Service
  |
  v
Application
  |
  v
Domain
```

Current repository mapping:

| Flow Layer | Current Evidence | Notes |
| --- | --- | --- |
| UI | `RevenueDriverHub.tsx`, `RevenueDriverIntentResolver.tsx` | Renders driver hierarchy and resolves deep-link intent. |
| Business Service | `revenue-drivers.ts`, `revenue-driver-intents.ts` | Module-local deterministic business rules. |
| Application | `src/app/api/v1/revenue-drivers/intent/route.ts` | Handles authenticated audit write. Package application use is not yet central for this feature. |
| Domain | Revenue language exists in driver/action/intent concepts | Not yet extracted as package-level revenue-driver aggregate. |

Current limitations:

- Runtime context is not created.
- Capability identity is not attached.
- Runtime event semantics are not standardized.
- UI owns the resolver call directly.
- Audit route uses Prisma and must remain outside the adapter core.

---

## Target Architecture

Required target flow:

```text
UI
  |
  v
Revenue Runtime Adapter
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

Target repository mapping:

| Flow Layer | Target Responsibility | First Implementation Boundary |
| --- | --- | --- |
| UI | Render hub and intent feedback. | Calls adapter only when flag is ON, or through a compatibility helper that defaults to legacy behavior. |
| Revenue Runtime Adapter | Wrap resolver with runtime context, capability, event, diagnostics, and fallback behavior. | New module under `src/modules/revenue-drivers/runtime/`. |
| Runtime | Provide pure runtime primitives. | Use `@nextshift/runtime` context, capability, event, and diagnostics functions. |
| Application | Continue current audit and use-case boundaries. | No broad application package migration in Pilot 1. |
| Domain | Preserve existing revenue driver concepts. | No new aggregate in Pilot 1. |

---

## Adapter Boundary

The adapter must be thin.

Allowed dependencies:

- Existing Revenue Driver constants and resolver.
- `@nextshift/runtime` primitives.
- Module-local flag helper.
- Safe logger or console abstraction if already present.

Disallowed dependencies:

- Prisma.
- Next.js request/response classes.
- Auth middleware.
- Deployment configuration.
- External network calls.
- Business Brain.
- Decision Brain.
- Dashboard or analytics service graph.

---

## Runtime Model

Recommended runtime context:

```text
scope: capability
metadata:
  module: revenue-drivers
  source: hub | dashboard | deep-link | api
  route: normalized route
  status: resolved | invalid | fallback
```

Recommended capability identity:

```text
capabilityId: revenue.driver.intent.resolve
kind: workflow
version: 1.0.0
```

Recommended event types:

```text
runtime.revenue.intent.resolved
runtime.revenue.intent.invalid
runtime.revenue.intent.fallback
runtime.revenue.adapter.degraded
```

Recommended diagnostics identity:

```text
diagnosticsId: revenue-runtime-adapter
component: revenue-drivers
scope: capability
```

---

## Feature Flag Strategy

Flag:

```text
retiredRevenueRuntimeFlag
```

Default:

```text
OFF
```

Rules:

- The flag must gate runtime adapter behavior, not UI availability.
- The current UI remains available regardless of flag state.
- OFF must produce current behavior and current output.
- ON may add runtime metadata, runtime events, diagnostics, and adapter-level tests.
- ON must not require Prisma for pure intent resolution.
- ON must degrade to legacy behavior if runtime construction fails.

---

## Rollback Strategy

Primary rollback:

```text
Set retiredRevenueRuntimeFlag to OFF.
```

Secondary rollback:

- Revert the adapter commit if the flag is insufficient.
- Keep existing Revenue Driver constants and resolver untouched.
- Keep existing audit route untouched.

Rollback should not require:

- Database migration rollback.
- CI rollback.
- Deployment topology rollback.
- Runtime package rollback.

---

## Error Handling

Expected errors:

- Missing intent.
- Unknown intent.
- Runtime metadata validation failure.
- Runtime event validation failure.
- Diagnostics creation failure.
- Audit API failure.

Handling rules:

- Missing intent returns `fallback`.
- Unknown intent returns `invalid`.
- Runtime failures return legacy resolver output and degraded runtime metadata.
- Audit failure remains non-blocking to the UI.
- User-facing copy continues to use existing translation keys.

---

## Logging

The adapter should log only normalized operational fields.

Recommended log events:

- Runtime adapter disabled.
- Runtime adapter resolved intent.
- Runtime adapter invalid intent.
- Runtime adapter fallback intent.
- Runtime adapter degraded.

Logs must include correlation ID when available.

---

## Metrics

Metric ownership belongs to the adapter or existing telemetry layer if one is already present.

Initial metrics are counters:

- Resolved count.
- Invalid count.
- Fallback count.
- Degraded count.
- Disabled count.

Metrics must be low cardinality and must not include raw user-generated text.

---

## Observability

Observability output should be visible in tests and logs before any dashboard is added.

Minimum observability evidence:

- Runtime-enabled output includes a correlation ID.
- Runtime-enabled output includes a capability ID.
- Runtime event type is deterministic.
- Degraded runtime path is testable.

---

## Testing Strategy

Testing layers:

1. Unit tests for flag parsing.
2. Unit tests for adapter output.
3. Unit tests for runtime metadata safety.
4. Regression tests for existing resolver behavior.
5. Optional component test only if UI behavior changes.

No end-to-end test is required for Pilot 1 unless the future implementation changes navigation behavior.
