# Platform Project Rollback Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-005 Platform Project Migration
Status: Review checklist

## Purpose

This checklist defines rollback readiness for future approved platform project migration.

## Package Rollback

- [ ] Restore prior `platform/index.md`.
- [ ] Remove MU-005 package artifacts only if explicitly approved.
- [ ] Confirm current platform project paths still resolve.
- [ ] Confirm companion registries still resolve.
- [ ] Re-run diff checks.

## Future Project Migration Rollback

If future approved project movement occurs:

- [ ] Reverse each approved `git mv` operation.
- [ ] Restore old-path README files or compatibility stubs.
- [ ] Restore previous `platform/index.md` and `platform/status.md`.
- [ ] Confirm lifecycle artifact counts match pre-migration counts.
- [ ] Confirm release package references still resolve.
- [ ] Confirm audit evidence references still resolve.

## Rollback Validation

```text
git status --short
git diff --check
git diff --cached --check
```

Additional checks:

- [ ] Business OS current path resolves.
- [ ] UI Kit current path resolves.
- [ ] Workspace Experience Framework current path resolves.
- [ ] AI current path resolves.
- [ ] Design System current path resolves.
- [ ] No runtime files changed.

## Rollback Boundaries

Do not use destructive rollback commands unless explicitly approved.

Do not roll back unrelated files, including:

- Governance package files.
- Release registry files.
- Audit registry files or audit reports.
- Runtime source files.
- Release package content.
