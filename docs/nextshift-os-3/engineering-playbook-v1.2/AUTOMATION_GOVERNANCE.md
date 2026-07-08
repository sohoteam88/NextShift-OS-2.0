# Automation Governance

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Define governed use of NextShift engineering automation.

---

## Governed Automation Utilities

Engineering Playbook v1.2 recognizes these automation utilities as governed support tools:

- AG-001 Artifact Generator
- AG-002 Chat Bootstrap Generator
- AG-003 Engineering Automation
- Developer Platform v1.1 validation commands

---

## Automation Boundary

Automation may:

- package repository evidence
- prepare AI handoff bundles
- validate Markdown links
- validate navigation consistency
- generate project closure packages
- report branch synchronization state

Automation must not:

- approve lifecycle state
- replace planning, verification, audit, or release decisions
- commit generated ZIP files
- stage context package changes without explicit task scope
- hide unrelated dirty worktree state

---

## Required Evidence Handling

Generated artifacts are evidence aids only.

The canonical source of truth remains the repository Markdown, source code, tests, audit records, release records, and Git history.

---

## Required Commands

Use these commands where relevant:

```bash
pnpm artifact:generate
pnpm chat:prepare
pnpm docs:links
pnpm docs:navigation
pnpm project:closure-package
pnpm git:branch-sync
```

---

## Git Policy

Generated files under `artifacts/` remain ignored.

Generated context package files under `docs/nextshift-os-3/context-package/` must not be staged unless a task explicitly authorizes context package updates.
