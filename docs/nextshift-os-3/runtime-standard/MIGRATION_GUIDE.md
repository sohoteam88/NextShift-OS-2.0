# Runtime Adapter Migration Guide

Version: 1.0

Status: Mandatory Standard

Last Updated: 2026-07-09

---

## Purpose

Guide future modules from legacy-only behavior to Runtime Capability Adapter behavior using the Pilot 1 pattern.

---

## Migration Principle

Migrate by wrapping, not rewriting.

The first runtime adapter for a module must preserve legacy output and add runtime metadata beside it.

---

## Step 1 - Select Candidate

Choose a candidate with:

- deterministic legacy output
- limited dependencies
- existing tests
- low migration risk
- straightforward rollback

Avoid first-pass candidates that require:

- Prisma schema changes
- auth rewrites
- deployment changes
- dashboard-wide behavior changes
- broad service graph replacement

---

## Step 2 - Document Contract

Before implementation, document:

- source files
- legacy behavior
- adapter input
- adapter output
- feature flag
- fallback behavior
- metadata contract
- observability
- tests
- rollback

---

## Step 3 - Add Runtime Folder

Use:

```text
src/modules/<module>/runtime/
  <Module>RuntimeAdapter.ts
  runtime-<module>-flag.ts
  index.ts
```

---

## Step 4 - Implement Feature Flag

Add a default-OFF public runtime flag:

```text
NEXT_PUBLIC_ENABLE_RUNTIME_<MODULE>
```

Only exact `true` enables the runtime path.

---

## Step 5 - Wrap Legacy Output

Adapter flow:

1. Resolve legacy output first.
2. If flag OFF, return legacy output and disabled runtime metadata.
3. If flag ON, build runtime artifacts.
4. Return legacy output plus runtime metadata.
5. If runtime fails, return legacy output plus degraded fallback metadata.

---

## Step 6 - Add Runtime Artifacts

Create:

- runtime context
- runtime capability
- event context when events are created
- runtime event
- runtime diagnostics

Use `@nextshift/runtime`.

---

## Step 7 - Add Tests

Add focused tests for:

- feature flag lifecycle
- runtime-enabled lifecycle
- fallback lifecycle
- metadata safety
- logging safety
- legacy preservation

---

## Step 8 - Validate

Run:

```bash
pnpm type-check
pnpm test
pnpm -r --filter './packages/*' test
pnpm docs:links
git diff --check
git diff --cached --check
```

---

## Step 9 - Review

Use:

- [Code Review Checklist](CODE_REVIEW_CHECKLIST.md)
- [Architecture Checklist](ARCHITECTURE_CHECKLIST.md)

Do not merge until both checklists pass.

---

## Step 10 - Rollback

Primary rollback:

```text
Set the adapter feature flag to OFF.
```

Secondary rollback:

- revert adapter PR
- preserve legacy resolver or service
- avoid schema rollback by not changing schema in first-pass adapter

---

## Module Guidance

Analytics:

- start with projection adapter, not storage rewrite
- preserve analytics service output

CRM:

- start with narrow lead or qualification adapter
- avoid full pipeline rewrite

Dashboard:

- start with read-only projection subset
- avoid broad service graph changes

Business Brain:

- require package tests first
- treat outputs as advisory until authority is approved

Decision Brain:

- use recommendation hooks only
- do not promote to final decision authority in first pass
