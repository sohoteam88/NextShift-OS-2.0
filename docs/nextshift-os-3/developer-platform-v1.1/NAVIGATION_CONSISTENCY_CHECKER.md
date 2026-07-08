# Navigation Consistency Checker

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Validate key navigation surfaces for missing or duplicate local links.

---

## Command

```bash
pnpm docs:navigation
```

---

## Scope

The checker reviews:

- `docs/nextshift-os-3/MASTER_INDEX.md`
- README files under `docs/nextshift-os-3/`

---

## Limitations

- It validates local link targets, not semantic ordering.
- It reports duplicate link targets as warnings.
- It does not rewrite navigation files.
- It does not replace manual project documentation review.
