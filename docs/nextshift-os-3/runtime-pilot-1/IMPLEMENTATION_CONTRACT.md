# OS 3.3 Runtime Pilot 1 Implementation Contract

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-1`

---

## Contract Purpose

Define the exact implementation boundary for the future Revenue Drivers Runtime Capability Adapter.

This document is a contract for a later implementation phase. It does not authorize implementation in this planning branch.

---

## Required Feature Flag

Name:

```text
retiredRevenueRuntimeFlag
```

Default:

```text
OFF
```

Interpretation:

- Enabled only when the environment value is exactly `true`.
- Missing, empty, `false`, or any other value means disabled.
- Because this is a public Next.js flag, it must not contain secrets.

Future helper requirement:

```ts
const runtimeRevenueEnabled =
  process.env.retiredRevenueRuntimeFlag === 'true';
```

The implementation may place this helper in a module-local config file, but must not edit env files in the first pass.

---

## Adapter Contract

Future adapter name:

```text
RevenueRuntimeAdapter
```

Recommended future file:

```text
src/modules/revenue-drivers/runtime/RevenueRuntimeAdapter.ts
```

Required public method shape:

```ts
type ResolveRevenueRuntimeInput = {
  route: string;
  intent?: string | null;
  tenantId?: string;
  userId?: string;
  source: 'hub' | 'dashboard' | 'deep-link' | 'api';
};

type ResolveRevenueRuntimeOutput = {
  resolution: RevenueDriverIntentResolution;
  runtime: {
    enabled: boolean;
    contextId?: string;
    correlationId?: string;
    capabilityId?: string;
    eventType?: string;
    diagnosticsStatus?: 'healthy' | 'degraded' | 'failed';
  };
};
```

The exact TypeScript names may be adjusted during implementation, but the semantic fields must remain.

---

## Runtime Responsibilities

Runtime owns:

- Context creation for a capability-scoped Revenue Driver operation.
- Capability identity and lifecycle metadata.
- Event identity, event type, and payload safety.
- Diagnostics status for runtime adapter execution.
- Correlation IDs for observability.
- Metadata safety rules, including forbidden secret-like keys.

Runtime does not own:

- UI rendering.
- Translation keys.
- Revenue Driver route definitions.
- Business copy.
- Prisma writes.
- Authentication.
- Tenant authorization.
- Final navigation behavior.

---

## Adapter Responsibilities

The Revenue Runtime Adapter owns:

- Reading the feature flag.
- Calling the existing resolver without changing its output contract.
- Mapping resolved, invalid, and fallback outcomes to runtime-safe metadata.
- Creating runtime context only when the flag is ON.
- Creating runtime capability metadata only when the flag is ON.
- Preparing runtime event metadata only when the flag is ON.
- Returning enough runtime metadata for tests and observability.
- Falling back to the legacy resolver on any runtime error.

The adapter must not:

- Change route definitions.
- Change intent aliases.
- Change translation keys.
- Require a database connection for normal intent resolution.
- Write audit logs directly.
- Import Prisma.
- Mutate runtime objects.
- Store secrets in metadata.

---

## Application Responsibilities

Application layer owns:

- Business use-case orchestration once Revenue Driver behavior is promoted from `src` constants into package services.
- Stable command/query boundaries for future revenue workflows.
- Domain-facing abstractions if a future pilot moves beyond intent resolution.

For Pilot 1, application participation should remain minimal. The adapter may continue using the existing resolver because moving logic into `packages/application` would increase scope.

---

## Domain Responsibilities

Domain layer owns:

- Stable business language for revenue drivers, actions, routes, and outcomes if those become package-level concepts later.
- Invariants for revenue capability identity only after a follow-up package extraction is approved.

Pilot 1 must not introduce new domain aggregates unless a later implementation plan explicitly approves it.

---

## Error Handling Contract

Required behavior:

- Invalid intent remains an explicit `invalid` result.
- Missing intent remains an explicit `fallback` result.
- Runtime construction failure must not break the user path.
- Runtime construction failure must return legacy resolution plus degraded runtime metadata.
- Adapter errors must not expose stack traces or secrets to the UI.
- API audit failure remains non-blocking for UI behavior.

Recommended runtime degraded output:

```ts
runtime: {
  enabled: true,
  diagnosticsStatus: 'degraded'
}
```

---

## Logging Contract

Logging must be structured and safe.

Allowed fields:

- `route`
- `intent`
- `status`
- `toolId`
- `driverId`
- `source`
- `correlationId`
- `capabilityId`
- `timestamp`

Forbidden fields:

- Tokens
- Passwords
- API keys
- Credentials
- Raw request headers
- Raw cookies
- Full user profile payloads
- Full tenant configuration payloads

---

## Metrics Contract

Pilot 1 metrics should be count-based and low cardinality.

Recommended metric names:

- `runtime.revenue.intent.resolved`
- `runtime.revenue.intent.invalid`
- `runtime.revenue.intent.fallback`
- `runtime.revenue.adapter.degraded`
- `runtime.revenue.adapter.disabled`

Recommended dimensions:

- `driverId`
- `status`
- `source`
- `flagState`

Do not use free-form intent text as a high-cardinality metric dimension unless it is normalized to a known intent list.

---

## Observability Contract

Every runtime-enabled resolution should provide:

- `correlationId`
- `contextId`
- `capabilityId`
- runtime event type
- diagnostics health or status

The UI must not depend on these values for display correctness. They exist for diagnostics, testing, and future runtime orchestration.

---

## Rollback Contract

Rollback must be possible without code removal:

1. Set `retiredRevenueRuntimeFlag` to OFF or remove it.
2. Redeploy with the flag disabled if needed.
3. Confirm Revenue Driver UI and intent resolution continue through the legacy path.
4. Leave adapter code dormant until a fix is approved.

No Prisma rollback is required because Pilot 1 must not modify schema.

---

## Test Contract

Future implementation must add or update tests for:

- Flag OFF preserves existing resolver behavior.
- Flag ON creates runtime metadata for resolved intent.
- Flag ON handles invalid intent.
- Flag ON handles missing intent fallback.
- Runtime construction error falls back to legacy resolution.
- Metadata does not include forbidden secret-like keys.
- Existing `src/__tests__/services/revenue-drivers.test.ts` behavior remains unchanged.

Minimum validation commands for implementation:

```bash
pnpm type-check
pnpm test
pnpm -r --filter './packages/*' test
pnpm docs:links
git diff --check
git diff --cached --check
```
