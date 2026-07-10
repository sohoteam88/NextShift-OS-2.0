# Platform Project Validation Checklist

Project: Repository Architecture Reset v1.0
Migration Unit: MU-005 Platform Project Migration
Status: Review checklist

## Required Command Validation

```text
git status --short
git diff --check
git diff --cached --check
```

## Link Validation

- [ ] `platform/index.md` local links resolve.
- [ ] MU-005 package artifact links resolve.
- [ ] Current project README links resolve.
- [ ] Companion registry links resolve:
  - [ ] `governance/index.md`
  - [ ] `releases/index.md`
  - [ ] `audit/index.md`

## Project Preservation Checks

- [ ] Business OS lifecycle artifacts remain discoverable.
- [ ] UI Kit lifecycle artifacts remain discoverable.
- [ ] Workspace Experience Framework lifecycle artifacts remain discoverable.
- [ ] AI Engineering Foundation artifacts remain discoverable.
- [ ] Design System lifecycle artifacts remain discoverable.
- [ ] Repository Architecture Reset artifacts are classified before movement.

## Artifact Count Checks

- [ ] Business OS markdown count preserved: 113.
- [ ] UI Kit markdown count preserved: 111.
- [ ] Workspace Experience Framework markdown count preserved: 132.
- [ ] AI markdown count preserved or classification delta documented: 28.
- [ ] Design System markdown count preserved: 50.

## Boundary Validation

- [ ] No runtime files changed.
- [ ] No package imports changed.
- [ ] No release package content rewritten.
- [ ] No governance migration performed.
- [ ] No audit taxonomy migration performed.
- [ ] No production or deployment changes performed.

## Future Migration Readiness

- [ ] Source-to-target manifest exists.
- [ ] Compatibility map exists.
- [ ] Rollback checklist exists.
- [ ] `git mv` operations are listed only as future approved operations.
