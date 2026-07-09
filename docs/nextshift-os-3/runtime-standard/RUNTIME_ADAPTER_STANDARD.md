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
