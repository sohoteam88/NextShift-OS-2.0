# Runtime Adapter Testing Standard

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Define mandatory tests for every Runtime Capability Adapter.

---

## Test Design

Adapters must be deterministic and testable without network calls, database access, auth middleware, or Next.js request objects.

Use dependency injection for:

- feature flag state
- legacy resolver or service
- runtime artifact creation
- logger

Do not rely on fragile module mocking when dependency injection can test the same behavior.

---

## Required Test File

Each adapter must add a focused test file:

```text
src/__tests__/services/<module>-runtime-adapter.test.ts
```

Existing module tests must remain in place.

---

## Required Coverage

Every adapter must test:

- flag missing is OFF
- explicit non-`true` flag values are OFF
- exact `true` flag is ON
- flag OFF returns legacy output
- flag ON returns runtime metadata
- runtime construction throw falls back to legacy output
- incomplete runtime artifacts fallback to legacy output
- fallback metadata is deterministic
- fallback warning includes safe `errorKind`
- fallback warning excludes tenant ID
- fallback warning excludes user ID
- fallback warning excludes raw error message
- fallback warning excludes stack trace
- UI-facing metadata excludes forbidden secret-like keys
- legacy resolver semantics remain unchanged

---

## Required Validation Commands

Implementation PRs must run:

```bash
pnpm type-check
pnpm test
pnpm -r --filter './packages/*' test
pnpm docs:links
git diff --check
git diff --cached --check
```

Documentation-only standard PRs must run:

```bash
pnpm docs:links
pnpm docs:navigation
git diff --check
git diff --cached --check
```

---

## Forbidden Test Shortcuts

Do not:

- hide tests behind feature flags
- skip runtime adapter tests without explicit approval
- weaken legacy resolver tests
- require real Prisma for adapter unit tests
- require live auth sessions for adapter unit tests
- require deployment config for adapter unit tests
- assert generated UUIDs exactly
- log raw error messages in test snapshots

---

## Expected Assertions

Runtime-enabled path:

- `runtime.enabled` is true
- `runtime.mode` is runtime
- `runtime.fallback` is false
- `runtime.contextId` exists
- `runtime.correlationId` exists
- `runtime.capabilityId` exists
- `runtime.eventType` is deterministic
- `runtime.diagnosticsStatus` is healthy

Fallback path:

- legacy output is preserved
- `runtime.enabled` is true
- `runtime.mode` is legacy
- `runtime.fallback` is true
- `runtime.diagnosticsStatus` is degraded
- `runtime.warning` is deterministic

Flag-OFF path:

- legacy output is preserved
- `runtime.enabled` is false
- `runtime.mode` is legacy
- runtime IDs are not required
