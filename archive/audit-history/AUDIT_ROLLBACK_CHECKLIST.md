# Audit Rollback Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-004 Audit Registry Migration
Status: Review checklist

## Purpose

This checklist defines rollback readiness for audit registry changes and future approved audit taxonomy migration.

## Package Rollback

- [ ] Restore prior `audit/index.md`.
- [ ] Remove MU-004 package artifacts only if explicitly approved.
- [ ] Confirm current audit evidence paths still resolve.
- [ ] Confirm companion registries still resolve.
- [ ] Re-run diff checks.

## Future Audit Taxonomy Rollback

If future approved audit file movement occurs:

- [ ] Reverse each approved `git mv` operation.
- [ ] Restore old-path stubs or original indexes.
- [ ] Restore previous `audit/index.md`.
- [ ] Confirm original audit filenames remain discoverable.
- [ ] Confirm audit report contents are unchanged.
- [ ] Confirm release and project references to audit reports still resolve.

## Rollback Validation

```text
git status --short
git diff --check
git diff --cached --check
```

Additional checks:

- [ ] `audit/index.md` links resolve.
- [ ] RAR audit reports resolve.
- [ ] Business OS audit reports resolve.
- [ ] Capability audit report families resolve.
- [ ] Business OS release package audit resolves.
- [ ] Audit file counts match pre-migration counts.

## Rollback Boundaries

Do not use destructive rollback commands unless explicitly approved.

Do not roll back unrelated files, including:

- Platform registry files.
- Governance package files.
- Release registry files.
- Runtime source files.
- Audit evidence not changed by MU-004.
