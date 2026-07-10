# Scoped Git Checkpoint Checklist

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Standardize Git release checkpoint evidence.

---

## Required Evidence

Every release checkpoint must report:

- staged files
- unstaged out-of-scope files
- ignored generated artifacts
- branch name
- HEAD before commit
- validation results
- commit SHA
- push result
- final branch synchronization

---

## Required Commands

Before commit:

```bash
git status --short
git diff --cached --name-only
git diff --check
git diff --cached --check
```

After push:

```bash
pnpm git:branch-sync
```

---

## Generated Artifact Rule

Generated artifacts under `artifacts/` must remain ignored and untracked.

---

## Context Package Rule

`docs/nextshift-os-3/context-package/*` must not be staged unless the task explicitly authorizes context package updates.
