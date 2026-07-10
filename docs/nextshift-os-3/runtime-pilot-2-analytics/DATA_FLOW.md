# OS 3.3 Runtime Pilot 2 Analytics Data Flow

Version: 1.0

Status: Planning Complete

Last Updated: 2026-07-09

Branch: `planning/os-3.3-runtime-pilot-2-analytics`

---

## Current Analytics Dashboard Data Flow

```text
/analytics page
  |
  | selects view by authenticated user role
  v
MemberAnalytics / LeaderAnalytics / OperatorAnalytics
  |
  | React Query fetch
  v
/api/v1/analytics/member | leader | operator
  |
  | requireAuthApi + requireRoleApi
  v
analyticsService.getMemberAnalytics / getLeaderAnalytics / getOperatorAnalytics
  |
  | Prisma reads + team scope + chart aggregation
  v
AnalyticsDashboardData
  |
  v
Analytics cards and charts
```

This path remains out of scope for Pilot 2 implementation because it is broad and Prisma-heavy.

---

## Current Analytics Center Projection Flow

```text
/api/v1/analytics-center
  |
  | requireAuthApi + workspace context resolution
  v
analyticsService.getAnalyticsCenter(userId, tenantId, workspaceContext)
  |
  | Prisma counts for KPI overview
  v
getAnalyticsProjection(userId, tenantId)
  |
  +--> businessStateService.getBusinessState(userId)
  +--> journeyStateService.getJourneyState(userId)
  +--> growthLoopStateService.getGrowthLoopState(userId)
  |
  v
AnalyticsProjection
  |
  | projectionToHealth / projectionToInsights / projectionToActions / projectionToBenchmark
  v
applyProjectionToAnalyticsCenter
  |
  v
AnalyticsCenter
```

The future Analytics Runtime Adapter should wrap the projection step first. It should not move Prisma counts into runtime in the first pass.

---

## Target Runtime Data Flow

```text
UI / Analytics Trigger
  |
  | userId + tenantId + source + projectionType
  v
Analytics Runtime Adapter
  |
  | feature flag check
  +--------------------------------+
  |                                |
  | OFF                            | ON
  v                                v
Legacy Analytics Projection        Runtime Context
  |                                |
  v                                v
Legacy Projection                  Runtime Capability
                                   |
                                   v
                               Legacy Analytics Projection
                                   |
                                   v
                               Runtime Event
                                   |
                                   v
                               Diagnostics
                                   |
                                   v
                               Projection + Runtime Metadata
```

The user-visible analytics projection values must remain equivalent in both branches.

---

## Flag OFF Data Contract

Input:

```json
{
  "userId": "user_1",
  "tenantId": "tenant_1",
  "source": "analytics-center",
  "projectionType": "analytics-center",
  "workspaceFocus": "sales"
}
```

Output requirement:

```json
{
  "projection": {
    "readiness": { "value": 64 },
    "progress": { "value": 57 },
    "growth": { "value": 72 }
  },
  "runtime": {
    "enabled": false,
    "mode": "legacy",
    "source": "analytics-center",
    "fallback": false
  }
}
```

The exact projection includes existing fields. Runtime IDs are not required when disabled.

---

## Flag ON Data Contract

Input:

```json
{
  "userId": "user_1",
  "tenantId": "tenant_1",
  "source": "analytics-center",
  "projectionType": "analytics-center",
  "workspaceFocus": "sales"
}
```

Output requirement:

```json
{
  "projection": {
    "readiness": { "value": 64 },
    "progress": { "value": 57 },
    "growth": { "value": 72 }
  },
  "runtime": {
    "enabled": true,
    "mode": "runtime",
    "source": "analytics-center",
    "fallback": false,
    "contextId": "runtime-context-id",
    "correlationId": "runtime-correlation-id",
    "capabilityId": "analytics.projection.resolve",
    "eventType": "runtime.analytics.projection.resolved",
    "diagnosticsStatus": "healthy"
  }
}
```

Generated IDs will vary. Tests must assert shape and invariants, not exact generated UUIDs.

---

## Runtime Failure Flow

Runtime construction failure:

```text
Analytics Runtime Adapter
  |
  | runtime context/capability/event/diagnostics failure
  v
catch (error)
  |
  | classify safe errorKind
  v
safe fallback warning
  |
  v
legacy analytics projection output + degraded runtime metadata
```

Fallback output:

```json
{
  "runtime": {
    "enabled": true,
    "mode": "legacy",
    "source": "analytics-center",
    "fallback": true,
    "diagnosticsStatus": "degraded",
    "warning": "runtime-analytics-adapter-fallback",
    "errorKind": "Error"
  }
}
```

Fallback metadata must not include tenant ID, user ID, raw error message, stack trace, headers, cookies, tokens, API keys, credentials, or raw runtime payloads.

---

## Event Payload Boundary

Runtime event payload may include:

- module: `analytics`
- source
- projection type
- normalized status
- workspace focus when normalized and low cardinality

Runtime event payload must not include:

- tenant ID
- user ID
- auth tokens
- credentials
- raw request payloads
- raw headers
- raw cookies
- raw error messages
- stack traces
- full workspace context
- full analytics dashboard payload

---

## Observability Data Flow

```text
Runtime Context
  |
  v
Runtime Capability
  |
  v
Runtime Event
  |
  v
Runtime Diagnostics
  |
  v
UI-safe runtime metadata
```

The UI must not rely on runtime metadata for rendering correctness.

---

## Logging Data Flow

Only fallback and diagnostic logs are planned.

Allowed fields:

- warning code
- safe error kind
- source
- projection type
- status
- correlation ID when available
- capability ID when available

Forbidden fields:

- tenant ID
- user ID
- headers
- cookies
- tokens
- API keys
- credentials
- raw payloads
- raw error messages
- stack traces
