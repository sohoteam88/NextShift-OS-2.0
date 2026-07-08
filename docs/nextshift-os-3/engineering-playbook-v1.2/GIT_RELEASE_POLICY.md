# Git Release Policy

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Standardize scoped Git release checkpoints for NextShift engineering projects.

---

## Pre-Commit Evidence

Every Git release checkpoint must report:

- current branch
- HEAD before commit
- staged files
- unstaged out-of-scope files
- ignored generated artifacts
- required validation results
- explicit confirmation that context package files are in scope if staged

---

## Required Pre-Commit Commands

```bash
git status --short
git diff --cached --name-only
git diff --check
git diff --cached --check
```

Project-specific validation must also be run before commit.

---

## Commit Scope

Stage only files approved by the release checkpoint task.

Do not stage:

- unrelated dirty files
- ignored generated artifacts
- context package files unless explicitly authorized
- regenerated artifacts outside release scope

---

## Post-Push Evidence

After push, report:

- commit SHA
- push result
- latest commit
- final working tree status
- branch synchronization state

Use:

```bash
pnpm git:branch-sync
```

when branch synchronization reporting is required.
