# OS 3.3 Runtime Pilot 2 Analytics Architecture

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-2-analytics`

---

## Architecture Decision

Pilot 2 will introduce a thin Analytics Runtime Adapter in a later implementation phase.

The adapter will sit between analytics triggers and the existing analytics projection resolver. It will use runtime primitives only when the feature flag is ON.

The pilot must follow [Runtime Adapter Standard v1.0](../runtime-standard/RUNTIME_ADAPTER_STANDARD.md) and the Pilot 1 pattern. It must not introduce a second runtime architecture.

---

## Current Analytics Architecture

Current analytics includes two relevant surfaces.

### Analytics Dashboard Surface

```text
/analytics page
  |
  v
MemberAnalytics / LeaderAnalytics / OperatorAnalytics
  |
  v
/api/v1/analytics/member | leader | operator
  |
  v
analyticsService.getMemberAnalytics / getLeaderAnalytics / getOperatorAnalytics
  |
  v
Prisma-backed analytics aggregation
  |
  v
AnalyticsDashboardData
```

This path includes Prisma reads, role checks, team scope resolution, member statistics, funnel performance, heatmap data, chart buckets, and AI router stats. It is too broad for the first analytics runtime pilot.

### Analytics Center Projection Surface

```text
/api/v1/analytics-center
  |
  v
analyticsService.getAnalyticsCenter
  |
  v
getAnalyticsProjection
  |
  v
Business State + Journey State + Growth Loop projections
  |
  v
applyProjectionToAnalyticsCenter
  |
  v
AnalyticsCenter
```

This path has a narrow projection seam and existing focused tests. It is the recommended Pilot 2 starting point.

---

## Current Flow Mapping

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
| UI / Analytics Trigger | `src/app/api/v1/analytics-center/route.ts`, analytics UI query surfaces | API route triggers analytics-center resolution after auth and workspace context resolution. |
| Business Service | `src/modules/analytics/analyticsService.ts`, `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts` | Builds analytics-center output and projection-derived health, insights, actions, and benchmark fields. |
| Application | `packages/application/src/analytics/analytics-application-service.ts` | Package-level analytics use cases already exist but should not be broadly rewritten in Pilot 2. |
| Domain | `packages/domain/src/analytics/` | Domain analytics concepts, calculators, projections, and repositories already exist. |

---

## Target Runtime Architecture

Required target flow:

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

Target repository mapping:

| Flow Layer | Target Responsibility | First Implementation Boundary |
| --- | --- | --- |
| UI / Analytics Trigger | Continue calling existing analytics endpoints and rendering existing responses. | No UI change required for flag OFF. |
| Analytics Runtime Adapter | Wrap analytics projection resolution with runtime context, capability, events, diagnostics, fallback, and safe metadata. | New module under `src/modules/analytics/runtime/`. |
| Runtime | Provide runtime context, capability, event, diagnostics, and correlation primitives. | Import through `@nextshift/runtime`. |
| Application | Continue package-backed analytics use cases and avoid broad application rewrites. | No package API change required in first pass. |
| Domain | Preserve existing analytics calculations and repository concepts. | No domain aggregate or schema change required. |

---

## Adapter Boundary

The adapter must be thin and module-scoped.

Allowed dependencies:

- existing analytics projection adapter
- existing analytics types
- `@nextshift/runtime`
- module-local feature flag helper
- injected logger
- injected runtime factories for tests

Disallowed dependencies:

- Prisma
- Next.js request or response objects
- auth middleware
- deployment configuration
- env files
- Dashboard Projection runtime
- Business Brain
- Decision Brain
- broad analytics dashboard service graph

---

## Runtime Model

Recommended runtime context:

```text
scope: capability
metadata:
  module: analytics
  source: analytics-center | member-dashboard | leader-dashboard | operator-dashboard | api
  projectionType: analytics-center
  status: resolved | fallback | degraded
```

Recommended capability identity:

```text
capabilityId: analytics.projection.resolve
kind: projection
version: 1.0.0
```

Recommended event types:

```text
runtime.analytics.projection.resolved
runtime.analytics.projection.fallback
runtime.analytics.adapter.degraded
runtime.analytics.adapter.disabled
```

Recommended diagnostics identity:

```text
diagnosticsId: analytics-runtime-adapter
component: analytics
scope: capability
```

---

## Feature Flag Strategy

Flag:

```text
retiredAnalyticsRuntimeFlag
```

Default:

```text
OFF
```

Rules:

- The flag gates runtime adapter behavior, not analytics availability.
- OFF returns current analytics projection behavior.
- ON may add runtime metadata, runtime events, diagnostics, and adapter-level tests.
- ON must not require Prisma inside the adapter.
- ON must degrade to legacy analytics projection behavior if runtime construction fails.
- Any non-`true` flag value remains OFF.

---

## Fallback Strategy

Fallback occurs when:

- runtime context creation throws
- runtime capability creation throws
- runtime event creation throws
- runtime diagnostics creation throws
- runtime metadata is incomplete
- dependency-injected runtime factories fail during tests

Fallback output must include:

```text
enabled: true
mode: legacy
fallback: true
diagnosticsStatus: degraded
warning: runtime-analytics-adapter-fallback
```

The projection output must remain the legacy analytics projection output.

---

## Safe Metadata Contract

UI-facing runtime metadata may include:

- `enabled`
- `mode`
- `source`
- `fallback`
- `confidence`
- `contextId`
- `correlationId`
- `capabilityId`
- `capabilityRuntimeId`
- `eventId`
- `eventType`
- `diagnosticsId`
- `diagnosticsStatus`
- `warning`
- safe `errorKind`

UI-facing runtime metadata must not include:

- tenant ID
- user ID
- auth tokens
- API keys
- credentials
- passwords
- raw cookies
- raw request headers
- raw request payloads
- raw error messages
- stack traces
- full tenant objects
- full user objects

Tenant and user identifiers may exist only in internal runtime context metadata when required.

---

## Observability Strategy

Runtime-enabled output should provide:

- `contextId`
- `correlationId`
- `capabilityId`
- `capabilityRuntimeId`
- `eventId`
- `eventType`
- `diagnosticsId`
- `diagnosticsStatus`

Fallback warnings may include:

- warning code
- safe `errorKind`
- normalized source
- normalized projection type
- normalized status
- correlation ID when available
- capability ID when available

Fallback warnings must not include tenant ID, user ID, raw messages, stack traces, or raw payloads.

---

## Testing Strategy

Future implementation must add focused tests at:

```text
src/__tests__/services/analytics-runtime-adapter.test.ts
```

Tests must use dependency injection for:

- feature flag state
- legacy projection resolver
- runtime artifact creation
- logger

Existing tests must remain in place, especially:

```text
src/__tests__/services/analytics-projection-adapter.test.ts
```

---

## Rollback Strategy

Primary rollback:

```text
Set retiredAnalyticsRuntimeFlag to OFF.
```

Secondary rollback:

- revert the future adapter implementation PR
- keep the legacy analytics projection adapter untouched
- keep analytics dashboard APIs untouched

Rollback must not require database migration rollback, CI rollback, deployment topology rollback, or runtime package rollback.

---

## Architecture Review Checklist

ChatGPT Architecture Review must verify:

- [ ] Target follows `UI / Analytics Trigger -> Analytics Runtime Adapter -> Runtime -> Application -> Domain`.
- [ ] Pilot starts with analytics projection seam, not broad dashboard rewrite.
- [ ] Feature flag defaults OFF and only exact `true` enables runtime.
- [ ] OFF preserves current analytics behavior.
- [ ] ON enables only analytics runtime adapter path.
- [ ] Runtime failures fallback to legacy analytics projection output.
- [ ] Adapter does not import Prisma.
- [ ] Adapter does not import Next.js request or response objects.
- [ ] Adapter does not import auth middleware.
- [ ] Adapter does not modify application or domain package APIs unless separately approved.
- [ ] Metadata boundary excludes tenant and user identifiers from UI metadata and fallback logs.
- [ ] Rollback is flag-based.

---

## Explicit Out Of Scope

- Dashboard Projection Runtime Integration
- Business Brain
- Decision Brain
- broad member, leader, or operator analytics dashboard rewrites
- Prisma schema changes
- database migrations
- env file changes
- CI modification
- production deployment
- Pilot 3
- tag creation
- merge
