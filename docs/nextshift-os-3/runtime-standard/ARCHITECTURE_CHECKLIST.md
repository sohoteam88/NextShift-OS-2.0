# Runtime Adapter Architecture Checklist

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Provide the architecture gate for future Runtime Capability Adapters.

---

## Required Architecture

Every adapter must preserve:

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

---

## Gate 1 - Candidate Selection

Before implementation, confirm:

- [ ] Candidate has a narrow source seam.
- [ ] Candidate has existing tests or can receive focused tests.
- [ ] Candidate does not require database migration.
- [ ] Candidate has clear legacy output.
- [ ] Candidate has straightforward rollback.
- [ ] Candidate does not require broad dashboard or analytics rewrites unless explicitly scoped.

---

## Gate 2 - Adapter Boundary

Confirm:

- [ ] Adapter is module-local.
- [ ] Adapter has one public entry point unless more are justified.
- [ ] Adapter returns legacy output plus runtime metadata.
- [ ] Adapter is not a service graph rewrite.
- [ ] Adapter does not own persistence.
- [ ] Adapter does not own auth.

---

## Gate 3 - Runtime Boundary

Confirm:

- [ ] Runtime package is imported through `@nextshift/runtime`.
- [ ] Runtime context scope is explicit.
- [ ] Capability identity is deterministic.
- [ ] Event type is deterministic.
- [ ] Diagnostics identity is deterministic.
- [ ] Runtime metadata is safe.

---

## Gate 4 - Application and Domain Boundary

Confirm:

- [ ] Application services remain selected and narrow.
- [ ] Adapter does not import full application indexes when avoidable.
- [ ] Domain changes are avoided unless explicitly planned.
- [ ] New domain aggregates are not introduced by accident.
- [ ] Legacy business rules remain source of truth until extraction is approved.

---

## Gate 5 - Risk Controls

Confirm:

- [ ] Feature flag default OFF.
- [ ] Rollback is flag-based.
- [ ] Runtime failure degrades to legacy output.
- [ ] Metadata boundaries are tested.
- [ ] Logging boundaries are tested.
- [ ] No Prisma schema change.
- [ ] No deployment change.

---

## High-Risk Targets

For Dashboard, Business Brain, Decision Brain, or other broad targets:

- require planning document
- require dedicated adapter contract
- require code review checklist
- require rollback plan
- require focused tests before merge
- avoid first-pass broad service graph rewrites
