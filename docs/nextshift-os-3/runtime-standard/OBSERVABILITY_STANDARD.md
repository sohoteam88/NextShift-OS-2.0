# Runtime Observability Standard

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Define observability, logging, diagnostics, and metrics requirements for Runtime Capability Adapters.

---

## Required Observability Fields

When the feature flag is ON and runtime construction succeeds, adapter output should expose:

- `contextId`
- `correlationId`
- `capabilityId`
- `capabilityRuntimeId`
- `eventId`
- `eventType`
- `diagnosticsId`
- `diagnosticsStatus`

These fields are for diagnostics, tests, and future runtime orchestration. UI display must not depend on them.

---

## Event Type Standard

Event types must be deterministic and dot-delimited:

```text
runtime.<module>.<action>.<status>
```

Examples:

- `runtime.revenue.intent.resolved`
- `runtime.revenue.intent.invalid`
- `runtime.revenue.intent.fallback`
- `runtime.revenue.adapter.degraded`

---

## Diagnostics Standard

Every adapter must produce diagnostics metadata for runtime-enabled execution.

Recommended diagnostics identity:

```text
diagnosticsId: <module>-runtime-adapter
component: <module>
scope: capability
```

Diagnostics statuses:

- healthy runtime path: `healthy`
- degraded fallback path: `degraded`
- critical failure only when legacy fallback also fails

Legacy fallback should normally be degraded, not failed.

---

## Logging Contract

Adapter logs must be structured and safe.

Allowed fields:

- warning code
- safe `errorKind`
- normalized route
- normalized action or intent
- status
- source
- correlation ID when available
- capability ID when available

Forbidden fields:

- tokens
- passwords
- API keys
- credentials
- raw request headers
- raw cookies
- tenant IDs in fallback warnings
- user IDs in fallback warnings
- full tenant payloads
- full user payloads
- raw error messages
- stack traces

---

## Metrics Standard

Metrics must be count-based and low cardinality.

Recommended metric classes:

- `runtime.<module>.<action>.resolved`
- `runtime.<module>.<action>.invalid`
- `runtime.<module>.<action>.fallback`
- `runtime.<module>.adapter.degraded`
- `runtime.<module>.adapter.disabled`

Allowed dimensions:

- known module
- known action
- known status
- known source
- flag state

Avoid:

- raw user input
- arbitrary strings
- full route with dynamic IDs
- tenant or user identifiers

---

## Observability Lifecycle

1. Adapter creates or derives runtime context.
2. Adapter creates runtime capability.
3. Adapter creates runtime event.
4. Adapter creates runtime diagnostics.
5. Adapter validates metadata completeness.
6. Adapter returns safe observability metadata.
7. Adapter logs only safe fallback warnings.

---

## Required Tests

Every adapter must test:

- runtime-enabled output contains correlation ID
- runtime-enabled output contains context ID
- runtime-enabled output contains capability ID
- runtime-enabled output contains event type
- runtime-enabled output contains diagnostics status
- fallback output contains degraded diagnostics
- fallback warning excludes sensitive fields
