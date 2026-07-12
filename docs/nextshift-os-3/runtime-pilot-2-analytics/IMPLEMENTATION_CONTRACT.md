# OS 3.3 Runtime Pilot 2 Analytics Implementation Contract

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-2-analytics`

---

## Contract Purpose

Define the future implementation contract for the Analytics Runtime Adapter.

This branch is planning-only. It does not authorize implementation.

---

## Required Feature Flag

Name:

```text
retiredAnalyticsRuntimeFlag
```

Default:

```text
OFF
```

Interpretation:

- Enabled only when the environment value is exactly `true`.
- Missing, empty, `false`, `FALSE`, `True`, `1`, `0`, and any other value means disabled.
- Because this is a public Next.js flag, it must not contain secrets.
- Do not modify env files in the first implementation pass.

Future helper:

```text
src/modules/analytics/runtime/retired-analytics-flag-helper.ts
```

Required behavior:

```ts
export function retiredAnalyticsFlagHelper(env: NodeJS.ProcessEnv = process.env) {
  return env.retiredAnalyticsRuntimeFlag === 'true';
}
```

---

## Adapter Contract

Future adapter name:

```text
AnalyticsRuntimeAdapter
```

Recommended future file:

```text
src/modules/analytics/runtime/AnalyticsRuntimeAdapter.ts
```

Recommended public method shape:

```ts
type ResolveAnalyticsRuntimeInput = {
  userId: string;
  tenantId?: string;
  source: 'analytics-center' | 'member-dashboard' | 'leader-dashboard' | 'operator-dashboard' | 'api';
  projectionType: 'analytics-center';
  workspaceFocus?: string;
};

type ResolveAnalyticsRuntimeOutput = {
  projection: AnalyticsProjection;
  runtime: {
    enabled: boolean;
    mode: 'legacy' | 'runtime';
    source: ResolveAnalyticsRuntimeInput['source'];
    fallback: boolean;
    confidence?: 'derived' | 'fallback';
    contextId?: string;
    correlationId?: string;
    capabilityId?: string;
    capabilityRuntimeId?: string;
    eventId?: string;
    eventType?: string;
    diagnosticsId?: string;
    diagnosticsStatus?: 'healthy' | 'degraded' | 'failed';
    warning?: string;
    errorKind?: string;
  };
};
```

The exact TypeScript names may be adjusted during implementation, but the semantic fields must remain.

---

## First Implementation Boundary

The first implementation should wrap:

```text
src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts
```

The adapter should preserve:

- `getAnalyticsProjection`
- `projectionToHealth`
- `projectionToInsights`
- `projectionToActions`
- `projectionToBenchmark`
- `applyProjectionToAnalyticsCenter`

The future runtime adapter may expose a new method such as:

```text
resolveAnalyticsRuntimeProjection
```

The implementation should then route the analytics-center path through the runtime adapter when the flag is ON, while keeping flag OFF behavior unchanged.

---

## Runtime Responsibilities

Runtime owns:

- context creation for a capability-scoped analytics projection operation
- capability identity
- runtime lifecycle metadata
- event identity and deterministic event type
- diagnostics identity and health status
- correlation IDs
- metadata safety rules

Runtime does not own:

- UI rendering
- chart rendering
- translation keys
- auth checks
- role authorization
- Prisma reads or writes
- workspace context resolution
- dashboard response shape
- final user-visible analytics values

---

## Analytics Runtime Adapter Responsibilities

The future Analytics Runtime Adapter owns:

- reading `retiredAnalyticsRuntimeFlag`
- calling the existing analytics projection resolver first
- preserving legacy projection output when the flag is OFF
- creating runtime context only when the flag is ON
- creating runtime capability metadata only when the flag is ON
- creating runtime events or diagnostics only when the flag is ON
- returning safe runtime metadata for tests and observability
- falling back to legacy analytics projection output on runtime error
- keeping UI-facing metadata free of tenant and user identifiers
- using dependency injection for tests

The adapter must not:

- import Prisma
- import Next.js request or response objects
- perform auth checks
- perform role authorization
- rewrite member, leader, or operator dashboards
- change analytics chart data contracts
- change application or domain package APIs unless explicitly approved later
- write audit logs directly
- log tenant ID, user ID, raw payloads, raw error messages, or stack traces

---

## Legacy Resolver and Service Responsibilities

Legacy analytics owns:

- existing Prisma-backed analytics dashboard aggregation in `src/modules/analytics/services/analytics-service.ts`
- existing analytics-center service in `src/modules/analytics/analyticsService.ts`
- existing analytics projection adapter functions in `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts`
- existing member, leader, and operator API route behavior
- existing role checks and auth boundaries at API routes
- existing chart response shapes and UI query keys

Legacy analytics remains the source of truth until the runtime adapter is proven.

---

## Application Responsibilities

Application layer owns package-backed analytics use cases in:

```text
packages/application/src/analytics/analytics-application-service.ts
```

For Pilot 2, application participation should remain narrow:

- continue using existing analytics application and domain exports as the package boundary
- avoid broad application service rewrites
- avoid moving Prisma aggregation into packages
- avoid changing public application package contracts unless a later implementation plan explicitly approves it

---

## Domain Responsibilities

Domain layer owns analytics concepts in:

```text
packages/domain/src/analytics/
```

For Pilot 2, domain behavior should remain unchanged:

- no new domain aggregate is required
- no analytics repository replacement is required
- no domain API change is required
- no persistence migration is required

---

## Runtime Identity

Recommended capability identity:

```text
capabilityId: analytics.projection.resolve
kind: projection
version: 1.0.0
```

Recommended context metadata:

```text
module: analytics
source: analytics-center | member-dashboard | leader-dashboard | operator-dashboard | api
projectionType: analytics-center
status: resolved | fallback | degraded
```

Tenant and user identifiers may exist only in internal runtime context metadata when required for runtime isolation or correlation. They must not be returned in UI-facing metadata and must not be logged in fallback warnings.

---

## Event Types

Recommended deterministic event types:

```text
runtime.analytics.projection.resolved
runtime.analytics.projection.fallback
runtime.analytics.adapter.degraded
runtime.analytics.adapter.disabled
```

Optional later event types, only if the implementation expands beyond the first projection seam:

```text
runtime.analytics.dashboard.resolved
runtime.analytics.dashboard.fallback
```

Pilot 2 implementation should not add those broader dashboard event types unless explicitly scoped.

---

## Error Handling Contract

Required behavior:

- Runtime construction failure must not break analytics.
- Incomplete runtime metadata must fallback to legacy analytics projection output.
- Fallback metadata must include `fallback: true`, `mode: legacy`, and `diagnosticsStatus: degraded`.
- Adapter errors must not expose stack traces, raw messages, tenant ID, or user ID to UI metadata or fallback logs.
- Existing analytics service errors remain governed by existing API error handling.

Required catch shape:

```ts
} catch (error) {
  const errorKind = classifyRuntimeAdapterError(error);
  warnAnalyticsRuntimeFallback(logger, input, 'runtime-analytics-adapter-fallback', errorKind);
  return legacyAnalyticsRuntimeFallback(projection, input.source, 'runtime-analytics-adapter-fallback', errorKind);
}
```

---

## Rollback Contract

Primary rollback:

```text
Set retiredAnalyticsRuntimeFlag to OFF.
```

Rollback must not require:

- database migration rollback
- CI rollback
- deployment topology rollback
- runtime package rollback
- dashboard UI rollback

Secondary rollback:

- revert the adapter PR
- keep the legacy analytics projection adapter and analytics services untouched
