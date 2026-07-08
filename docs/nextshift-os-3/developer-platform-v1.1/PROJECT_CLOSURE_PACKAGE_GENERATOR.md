# Project Closure Package Generator

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Standardize project closure package generation.

---

## Command

```bash
pnpm project:closure-package -- --id <id> --release-dir <dir> --audit <audit-md>
```

Example:

```bash
pnpm project:closure-package -- --id RUNTIME_PLATFORM_V1 \
  --release-dir docs/nextshift-os-3/runtime-platform/release \
  --audit audit/RUNTIME_PLATFORM_V1_PROJECT_AUDIT_REPORT.md
```

---

## Required Release Sources

The release directory must contain:

- `RUNTIME_PLATFORM_V1_RELEASE_SUMMARY.md`
- `RUNTIME_PLATFORM_V1_RETROSPECTIVE.md`
- `RUNTIME_PLATFORM_V1_LESSONS_LEARNED.md`
- `RUNTIME_PLATFORM_V1_AUTOMATION_REVIEW.md`

The audit argument must point to the project audit report.

---

## Output

The command delegates to:

```bash
pnpm artifact:generate
```

and produces a release artifact under ignored `artifacts/`.

---

## Limitations

The v1.1 generator supports the Runtime Platform v1.0 closure file naming convention. Future projects should either reuse that convention or extend the generator with configurable source names.
