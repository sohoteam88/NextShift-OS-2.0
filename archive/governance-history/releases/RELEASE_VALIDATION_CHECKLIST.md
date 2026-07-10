# Release Validation Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-003 Release Registry Migration
Status: Review checklist

## Required Command Validation

```text
git status --short
git diff --check
git diff --cached --check
```

## Link Validation

- [ ] `releases/index.md` local links resolve.
- [ ] MU-003 package artifact links resolve.
- [ ] Current release package README links resolve.
- [ ] Companion registry links resolve:
  - [ ] `platform/index.md`
  - [ ] `platform/status.md`
  - [ ] `governance/index.md`
  - [ ] `audit/index.md`

## Release Package Validation

- [ ] Business OS v1.0 current path resolves.
- [ ] AI Engineering Foundation v1.0 current path resolves.
- [ ] Engineering Standards v1.0 current path resolves.
- [ ] Engineering Standards v1.1 current path resolves.
- [ ] Project release references resolve.

## Immutability Validation

- [ ] No release package content changed.
- [ ] No release package directories moved.
- [ ] No release manifests rewritten.
- [ ] No release notes rewritten.
- [ ] Original release identifiers preserved in registry metadata.

## Boundary Validation

- [ ] No tags created.
- [ ] No release branches created.
- [ ] No production deployment performed.
- [ ] No runtime files changed.
- [ ] No governance migration performed.
- [ ] No audit migration performed.

## Future Migration Readiness

- [ ] Canonical release path standard documented.
- [ ] Future target paths mapped.
- [ ] Compatibility map exists.
- [ ] Rollback checklist exists.
