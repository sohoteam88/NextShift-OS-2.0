# Runtime Adapter Standard

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Define the required Runtime Capability Adapter pattern for NextShift OS.

This standard is extracted from the Revenue Drivers Runtime Capability Adapter. Future adapters must follow the same structure unless a new planning review explicitly updates this standard.

---

## Required Flow

```text
UI
  |
  v
Adapter
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

The adapter is the only new seam between UI and runtime primitives.

---

## Adapter Responsibilities

Each adapter must:

- read a module-local feature flag helper
- call the legacy resolver or service first
- preserve legacy behavior when the flag is OFF
- create runtime context only when the flag is ON
- create runtime capability metadata only when the flag is ON
- create runtime events or diagnostics only when the flag is ON
- return runtime metadata for tests and observability
- fallback to legacy behavior if runtime construction fails
- keep public API minimal
- use dependency injection for runtime artifact creation in tests

---

## Runtime Responsibilities

Runtime owns:

- context creation
- capability identity
- lifecycle metadata
- event identity
- diagnostics state
- correlation IDs
- metadata safety rules

Runtime does not own:

- UI rendering
- translation keys
- Prisma writes
- authentication
- tenant authorization
- business copy
- final navigation behavior

---

## Required Package Boundary

Adapters must import runtime primitives through:

```ts
import { createRuntimeContext } from '@nextshift/runtime';
```

Adapters must not import runtime source files through relative paths such as:

```ts
import { createRuntimeContext } from '../../../../packages/runtime/src/index';
```

If a root app or test environment cannot resolve `@nextshift/runtime`, add the smallest required alias or package adjustment. Do not introduce a broad monorepo refactor.

---

## Adapter Factory

New Runtime Capability Adapters must use `createRuntimeAdapter()` from `@nextshift/runtime`.

The factory turns this standard from a documentation convention into a typed adapter contract. It owns the shared adapter lifecycle:

- required feature flag evaluation
- required legacy resolver execution before runtime routing
- default OFF behavior with `enabled: false`, `mode: legacy`, and `fallback: false`
- runtime metadata skeleton with `enabled`, `mode`, `source`, `fallback`, and `confidence`
- runtime metadata completeness validation
- runtime construction failure fallback to legacy behavior
- invalid runtime output fallback to legacy behavior
- safe fallback warning logging
- safe `errorKind` classification without stack traces or raw error messages
- dependency injection for tests
- `createWarningPayload` must explicitly enumerate safe fields. It must not directly spread `input`, request objects, runtime payloads, context metadata, or dependency objects because that can leak tenantId, userId, headers, cookies, tokens, API keys, credentials, or raw runtime payloads into logs.

Adapter modules remain responsible for module-specific logic only:

- selecting the legacy resolver or service
- mapping module input to source and confidence
- creating module-specific runtime context, capability, event, and diagnostics artifacts
- composing the public adapter output without changing legacy return structure
- creating safe warning payload fields that exclude tenantId, userId, headers, cookies, tokens, API keys, credentials, and raw runtime payloads

Handwritten adapters that duplicate the factory-owned lifecycle are no longer compliant for new Runtime Capability Adapter work. Existing adapters must migrate to `createRuntimeAdapter()` before being used as reference implementations for future pilots.

---

## Code Review Checklist

Runtime Capability Adapter reviews must verify:

1. `isEnabled` calls the real module feature flag helper or a dependency-injected equivalent used only for tests.
2. `createWarningPayload` explicitly enumerates safe fields and does not spread `input`, runtime context, request objects, headers, cookies, dependency objects, or raw runtime payloads.
3. Fallback warnings do not include tenantId, userId, tokens, API keys, credentials, raw error messages, or stack traces.
4. The adapter public API preserves legacy output shape when the feature flag is OFF.
5. Runtime construction failures and invalid runtime metadata both fallback to legacy behavior.
6. Tests cover flag OFF, flag ON, runtime failure fallback, invalid runtime output fallback, and safe UI-facing metadata.

---

## Required File Shape

Each adapter should use a local runtime folder:

```text
src/modules/<module>/runtime/
  <Module>RuntimeAdapter.ts
  runtime-<module>-flag.ts
  index.ts
```

Optional:

```text
src/modules/<module>/runtime/<module>-runtime-logger.ts
```

Only add optional files when they reduce real complexity.

---

## Public API Shape

The adapter public API must return:

- the legacy resolution or output
- runtime metadata

Required metadata fields:

- `enabled`
- `mode`
- `source`
- `fallback`
- `confidence` when meaningful

Runtime-enabled metadata should include:

- `contextId`
- `correlationId`
- `capabilityId`
- `capabilityRuntimeId`
- `eventId`
- `eventType`
- `diagnosticsId`
- `diagnosticsStatus`

Fallback metadata should include:

- `fallback: true`
- `mode: legacy`
- `diagnosticsStatus: degraded`
- `warning`
- safe `errorKind` when an exception was caught

---

## Forbidden Coupling

Adapters must not import:

- Prisma
- Next.js request or response types
- auth middleware
- deployment configuration
- env files
- Dashboard service graphs from unrelated adapters
- Business Brain unless the adapter is explicitly a Business Brain adapter
- Decision Brain unless the adapter is explicitly a Decision Brain adapter

---

## Lifecycle

Adapter lifecycle:

1. Receive UI or module input.
2. Resolve legacy output first.
3. Evaluate feature flag.
4. If OFF, return legacy output with runtime disabled metadata.
5. If ON, build runtime context and capability.
6. Build runtime event and diagnostics.
7. Validate runtime metadata completeness.
8. Return legacy output plus runtime metadata.
9. If runtime fails, log safe fallback warning and return legacy output.

---

## Mandatory Consumers

Analytics, CRM, Dashboard, Business Brain, and Decision Brain runtime adapters must follow this standard before implementation begins.
