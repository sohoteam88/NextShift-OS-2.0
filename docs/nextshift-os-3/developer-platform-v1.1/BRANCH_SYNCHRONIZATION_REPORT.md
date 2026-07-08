# Branch Synchronization Report

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Produce a standard post-push branch synchronization report.

---

## Command

```bash
pnpm git:branch-sync
```

---

## Report Contents

The report includes:

- current branch
- local HEAD
- upstream tracking branch
- latest commit
- branch status
- working tree status

---

## Use

Run after pushing a release checkpoint branch.

Include the output in release checkpoint reports when branch synchronization evidence is required.
