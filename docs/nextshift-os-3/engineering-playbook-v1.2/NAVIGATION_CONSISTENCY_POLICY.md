# Navigation Consistency Policy

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Ensure major repository navigation surfaces remain consistent and reachable.

---

## Required Command

```bash
pnpm docs:navigation
```

---

## Required Navigation Surfaces

Navigation consistency applies to:

- `docs/nextshift-os-3/MASTER_INDEX.md`
- project README files
- release package README files
- lifecycle package README files
- major platform and engineering indexes

---

## Required Validation Points

Run navigation validation when:

- adding a project, slice, release, or governance package
- changing README links
- changing `MASTER_INDEX.md`
- preparing release checkpoints with documentation scope
- closing a project

---

## Evidence Requirements

Reports must include:

- command executed
- pass or fail result
- missing target count
- duplicate or advisory warning count when available
- whether unresolved items are scoped or pre-existing

---

## Scope Boundary

Navigation validation confirms target reachability.

It does not judge semantic ordering, document completeness, or release approval.
