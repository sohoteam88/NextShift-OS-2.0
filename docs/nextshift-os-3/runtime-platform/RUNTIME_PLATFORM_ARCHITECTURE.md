# Runtime Platform Architecture

Version: 1.0

Status: Frozen

Last Updated: 2026-07-09

---

## Architecture

Runtime Platform v1.0 standardizes this flow:

```text
UI
  |
  v
Runtime Adapter
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

The Runtime Adapter is the only approved module-local seam between an existing UI or module trigger and runtime primitives.

---

## Layer Responsibilities

### UI

UI owns:

- rendering
- user interaction
- existing module calls
- product-specific behavior

UI must not own:

- runtime context construction
- runtime event creation
- fallback classification
- runtime metadata safety

### Runtime Adapter

The adapter owns:

- feature flag evaluation
- runtime routing
- legacy fallback
- safe warning classification
- safe UI-facing runtime metadata
- dependency injection for deterministic tests

The adapter must preserve legacy behavior when the feature flag is OFF or when runtime fails.

### Runtime

Runtime owns:

- runtime context
- capability identity
- event identity
- diagnostics identity
- correlation identifiers
- lifecycle metadata

Runtime does not own UI rendering, Prisma writes, authentication, deployment configuration, or business copy.

### Application

Application owns use-case orchestration and application services. Runtime adapters may integrate through application services only through narrow, explicit boundaries.

### Domain

Domain owns core business model behavior and invariants. Runtime adapters must not bypass domain rules.

---

## Feature Flag Architecture

Every runtime adapter must use a module-local feature flag helper.

Feature flags must:

- default OFF
- enable only on exact string value `true`
- preserve legacy behavior when missing or disabled
- avoid `.env` file changes during adapter implementation

The two frozen reference flags are:

- `retiredRevenueRuntimeFlag`
- `retiredAnalyticsRuntimeFlag`

---

## Fallback Architecture

Runtime fallback is explicit.

Fallback must happen when:

- runtime construction throws
- runtime diagnostics construction throws
- runtime metadata is incomplete
- injected runtime factories fail in tests
- adapter validation rejects runtime output

Fallback must return legacy behavior and mark runtime metadata as degraded.

---

## Metadata Architecture

UI-facing metadata may expose only operational runtime fields such as:

- `enabled`
- `mode`
- `source`
- `fallback`
- `confidence`
- runtime context, capability, event, diagnostics, and correlation identifiers
- safe `warning`
- safe `errorKind`

UI-facing metadata must not expose tenant IDs, user IDs, headers, cookies, tokens, credentials, raw payloads, raw error messages, or stack traces.

---

## Approved Import Boundary

Adapters must import runtime primitives through:

```ts
import { createRuntimeContext } from '@nextshift/runtime';
```

Adapters must not import from `packages/runtime/src` through relative paths.
