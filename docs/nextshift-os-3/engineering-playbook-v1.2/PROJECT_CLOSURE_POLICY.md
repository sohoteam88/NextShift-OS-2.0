# Project Closure Policy

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Standardize project closure evidence for platform and governance projects.

---

## Required Closure Evidence

Project closure packages must include:

- project release summary
- retrospective
- lessons learned
- automation review
- project audit report
- unresolved advisory list
- branch synchronization evidence

---

## Closure Generator

When applicable, use:

```bash
pnpm project:closure-package -- --id <id> --release-dir <dir> --audit <audit-md>
```

The closure generator packages evidence. It does not approve closure.

---

## Closure Conditions

A project may close only after:

- release artifacts are complete
- required validation has passed or blockers are documented
- audit state is resolved
- Git release checkpoint is complete
- unresolved advisories are carried forward
- branch synchronization is reported

---

## Non-Substitution Rule

Closure evidence does not replace release notes, audit reports, approval records, or Git history.
