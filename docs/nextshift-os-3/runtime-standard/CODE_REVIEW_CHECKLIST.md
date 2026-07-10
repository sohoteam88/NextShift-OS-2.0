# Runtime Adapter Code Review Checklist

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Provide the required review checklist for Runtime Capability Adapter PRs.

---

## Architecture

- [ ] Adapter follows `UI -> Adapter -> Runtime -> Application -> Domain`.
- [ ] Adapter is narrow and module-scoped.
- [ ] Adapter imports runtime through `@nextshift/runtime`.
- [ ] Adapter does not import runtime package source through relative paths.
- [ ] Adapter does not introduce a second runtime architecture.
- [ ] Adapter does not integrate unrelated modules.

---

## Feature Flag

- [ ] Adapter has a module-local feature flag helper.
- [ ] Feature flag defaults OFF.
- [ ] Only exact `true` enables runtime path.
- [ ] Missing value is OFF.
- [ ] Non-`true` strings are OFF.
- [ ] No env files are modified unless explicitly approved.

---

## Legacy Preservation

- [ ] Legacy resolver or service remains the source of truth.
- [ ] Flag OFF preserves legacy output.
- [ ] UI-visible output does not change when flag is OFF.
- [ ] Existing tests still pass.

---

## Fallback

- [ ] Runtime construction errors are caught with `catch (error)`.
- [ ] Error handling records only safe `errorKind`.
- [ ] Raw error messages are not logged.
- [ ] Stack traces are not logged.
- [ ] Runtime failure falls back to legacy output.
- [ ] Incomplete runtime metadata falls back to legacy output.
- [ ] Fallback output includes degraded diagnostics.

---

## Metadata Safety

- [ ] UI-facing metadata excludes tenant ID.
- [ ] UI-facing metadata excludes user ID.
- [ ] Fallback logs exclude tenant ID.
- [ ] Fallback logs exclude user ID.
- [ ] Metadata keys avoid secret-like names.
- [ ] Event payload excludes raw payloads and secrets.

---

## Coupling

- [ ] Adapter does not import Prisma.
- [ ] Adapter does not import Next.js request or response objects.
- [ ] Adapter does not import auth middleware.
- [ ] Adapter does not import deployment config.
- [ ] Adapter does not import unrelated service graphs.

---

## Observability

- [ ] Runtime-enabled output includes correlation ID.
- [ ] Runtime-enabled output includes context ID.
- [ ] Runtime-enabled output includes capability ID.
- [ ] Runtime-enabled output includes event type.
- [ ] Runtime-enabled output includes diagnostics status.
- [ ] Metrics, if added, are low cardinality.

---

## Tests

- [ ] Adapter has focused tests.
- [ ] Flag OFF is tested.
- [ ] Flag ON is tested.
- [ ] Falsy flag values are tested.
- [ ] Runtime construction failure is tested.
- [ ] Incomplete runtime output is tested.
- [ ] Safe logging boundary is tested.
- [ ] Safe metadata boundary is tested.
- [ ] Package tests pass.

---

## Forbidden Changes

- [ ] No Prisma schema changes.
- [ ] No env file changes.
- [ ] No deployment file changes.
- [ ] No unrelated CI changes.
- [ ] No tag creation.
- [ ] No Pilot 2 work unless the PR is explicitly Pilot 2.
