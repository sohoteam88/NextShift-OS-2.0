# Lessons Learned

Version: 1.0

Status: Frozen

Last Updated: 2026-07-09

---

## Narrow Pilots Worked

The Runtime Readiness Review correctly recommended starting with a narrow pilot rather than broad Runtime Integration.

Revenue Drivers worked as the first pilot because it was deterministic, already tested, and easy to roll back.

Analytics worked as the second pilot because it had a clear projection seam and could reuse the same adapter standard.

---

## The Adapter Must Own Runtime Routing

The mature pattern is:

```text
Caller
  |
  v
Runtime Adapter
  |
  v
Feature Flag
  |
  v
Runtime
  |
  v
Legacy Fallback
```

Feature flag checks should live inside the adapter, not in the caller. This keeps callers stable and prevents runtime routing from leaking into application services.

---

## Legacy Behavior Is The Safety Net

Both pilots preserved existing behavior by resolving or preserving legacy output before runtime work.

This made rollback simple:

- turn the flag OFF
- let runtime fallback return legacy output
- avoid broad service rewrites

---

## Safe Metadata Needs A Hard Boundary

Runtime context may eventually need tenant or user identifiers internally.

UI-facing metadata and fallback warnings must not expose:

- tenant IDs
- user IDs
- raw payloads
- headers
- cookies
- tokens
- credentials
- raw error messages
- stack traces

This boundary must remain mandatory for all future adapters.

---

## Package Boundary Matters

Adapters must import runtime primitives from `@nextshift/runtime`.

Relative imports into `packages/runtime/src` are not allowed because they make adapters fragile and bypass the workspace package contract.

---

## Tests Define The Standard

The useful tests were small and direct:

- flag OFF
- non-`true` flag values
- flag ON
- runtime failure
- invalid runtime output
- safe fallback warning
- safe metadata

Future adapters should copy this testing shape before adding module-specific edge cases.
