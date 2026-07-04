# Release Rollback Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-003 Release Registry Migration
Status: Review checklist

## Purpose

This checklist defines rollback readiness for release registry changes and future approved release package migration.

## Package Rollback

- [ ] Restore prior `releases/index.md`.
- [ ] Remove MU-003 package artifacts only if explicitly approved.
- [ ] Confirm current release package paths still resolve.
- [ ] Confirm companion registries still resolve.
- [ ] Re-run diff checks.

## Future Release Package Migration Rollback

If future approved release package movement occurs:

- [ ] Reverse each approved `git mv` operation.
- [ ] Restore old-path stubs or original indexes.
- [ ] Restore previous `releases/index.md`.
- [ ] Confirm release manifests and release notes are unchanged.
- [ ] Confirm original release identifiers remain discoverable.
- [ ] Confirm audit evidence remains discoverable.

## Rollback Validation

```text
git status --short
git diff --check
git diff --cached --check
```

Additional checks:

- [ ] `releases/index.md` links resolve.
- [ ] Business OS v1.0 current path resolves.
- [ ] AI Engineering Foundation v1.0 current path resolves.
- [ ] Engineering Standards v1.0 current path resolves.
- [ ] Engineering Standards v1.1 current path resolves.
- [ ] Release package file counts match pre-migration counts.

## Rollback Boundaries

Do not use destructive rollback commands unless explicitly approved.

Do not roll back unrelated files, including:

- Platform registry files.
- Governance package files.
- Audit registry or audit reports.
- Runtime source files.
- Release package content that was not changed by MU-003.
