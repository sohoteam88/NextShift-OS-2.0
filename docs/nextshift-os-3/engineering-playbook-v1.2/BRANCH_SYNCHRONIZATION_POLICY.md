# Branch Synchronization Policy

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Require explicit branch synchronization evidence after release pushes and major governance checkpoints.

---

## Required Command

```bash
pnpm git:branch-sync
```

---

## Required Evidence

Branch synchronization reports must include:

- current branch
- upstream tracking state
- local HEAD
- remote HEAD or ahead/behind state
- latest commit
- final working tree status

---

## Required Validation Points

Run branch synchronization reporting after:

- release checkpoint pushes
- audit checkpoint pushes
- project closure pushes
- tag pushes when the release task requires branch and tag confirmation

---

## Failure Handling

If branch synchronization cannot be confirmed:

- report the blocker
- do not claim release completion
- do not infer remote state from local commit history alone
- rerun after fetch or network restoration when authorized
