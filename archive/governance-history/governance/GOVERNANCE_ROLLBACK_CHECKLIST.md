# Governance Rollback Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-002 Governance Migration
Status: Review checklist

## Purpose

This checklist defines rollback readiness for future MU-002 governance migration. It also applies to this implementation package if review requires reverting package files.

## Package Rollback

- [ ] Restore prior `governance/index.md`.
- [ ] Remove MU-002 package artifacts only if explicitly approved.
- [ ] Confirm companion registries still resolve.
- [ ] Re-run diff checks.

## Future Migration Rollback

If future approved file movement occurs:

- [ ] Reverse each approved `git mv` operation.
- [ ] Restore old-path stubs or original files.
- [ ] Restore previous `governance/index.md`.
- [ ] Confirm standards versions remain discoverable.
- [ ] Confirm ADR and RFC history remain discoverable.
- [ ] Confirm release package directories were not moved.

## Rollback Validation

```text
git status --short
git diff --check
git diff --cached --check
```

Additional checks:

- [ ] `governance/index.md` links resolve.
- [ ] Current source paths resolve.
- [ ] STD-004, STD-005, STD-006, and STD-007 resolve.
- [ ] Release package paths remain unchanged.
- [ ] Runtime paths remain unchanged.

## Rollback Boundaries

Do not use destructive rollback commands unless explicitly approved.

Do not roll back unrelated files, including:

- RAR-002 platform, release, or audit registry files.
- Existing audit reports.
- Runtime source files.
- Release package files.
