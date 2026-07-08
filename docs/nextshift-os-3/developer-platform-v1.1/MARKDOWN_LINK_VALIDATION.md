# Markdown Link Validation

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Provide a repository-standard command for validating local Markdown links across NextShift documentation.

---

## Command

```bash
pnpm docs:links
```

---

## Scope

The validator scans:

```text
docs/nextshift-os-3/**/*.md
```

It validates local relative links and repository-root links.

---

## Limitations

- External links are skipped.
- Anchor-only links are skipped.
- Anchor existence inside target files is not validated.
- Reference-style Markdown links are not validated in v1.1.

---

## Failure Behavior

The command exits non-zero when a local Markdown link target does not exist or resolves outside the repository.
