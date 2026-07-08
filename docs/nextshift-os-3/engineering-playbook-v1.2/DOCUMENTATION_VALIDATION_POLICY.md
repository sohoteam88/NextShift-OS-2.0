# Documentation Validation Policy

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Define when Markdown link validation is required.

---

## Required Command

```bash
pnpm docs:links
```

---

## Required Validation Points

Run Markdown link validation when documentation changes are part of:

- Stop B implementation
- Stop C release preparation
- Git release checkpoints
- project closure
- audit corrections that modify navigation or documentation references

---

## Evidence Requirements

Reports must include:

- command executed
- pass or fail result
- unresolved failures
- whether failures are in scoped files or pre-existing out-of-scope files

---

## Scope Boundary

Markdown link validation confirms local link integrity.

It does not replace:

- architecture audit
- release approval
- project verification
- semantic documentation review
