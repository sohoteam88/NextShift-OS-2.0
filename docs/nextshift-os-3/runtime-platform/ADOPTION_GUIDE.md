# Adoption Guide

Version: 1.0

Status: Frozen

Last Updated: 2026-07-09

---

## Purpose

This guide defines how future NextShift OS modules adopt Runtime Platform v1.0.

Applies to:

- Revenue
- Analytics
- Dashboard
- CRM
- Business Brain
- Decision Brain

---

## Adoption Requirements

Before implementation, each adapter must have:

- a planning package
- an implementation contract
- an architecture document
- a data flow document
- acceptance criteria
- an execution task
- explicit out-of-scope items

The implementation must follow [Runtime Adapter Standard v1.0](../runtime-standard/README.md).

---

## Implementation Shape

Each module should add a module-local runtime folder:

```text
src/modules/<module>/runtime/
  <Module>RuntimeAdapter.ts
  runtime-<module>-flag.ts
  index.ts
```

The existing legacy service or resolver must remain the source of truth until the adapter is validated and separately approved for deeper migration.

---

## Feature Flag Rules

Each adapter must:

- use a module-specific flag
- default OFF
- enable only on exact value `true`
- preserve legacy behavior for all other values
- avoid modifying env files during adapter implementation

Example:

```text
NEXT_PUBLIC_ENABLE_RUNTIME_<MODULE>
```

---

## Fallback Rules

Each adapter must:

- compute or preserve legacy output before runtime work
- catch runtime construction failures
- reject incomplete runtime metadata
- return legacy output on fallback
- mark fallback metadata explicitly
- log only safe warning classification

Fallback must never hide legacy behavior.

---

## Test Rules

Each adapter must include focused tests for:

- missing flag uses legacy path
- explicit non-`true` values stay OFF
- flag ON uses runtime path
- runtime construction failure falls back
- invalid runtime output falls back
- fallback warning log is safe
- UI-facing metadata excludes tenant and user identifiers

---

## Review Rules

Each adapter must pass:

- implementation validation
- Claude Code Review
- architecture review
- refinement for accepted findings
- archive or documented handling of review evidence

No adapter should be promoted as a platform reference before review findings are resolved or explicitly accepted.

---

## Migration Rule

Runtime Platform v1.0 permits narrow adapter integration.

It does not approve broad rewrites, dashboard-wide runtime migration, Prisma changes, deployment changes, or Business Brain / Decision Brain activation unless those are covered by a later pilot plan.
