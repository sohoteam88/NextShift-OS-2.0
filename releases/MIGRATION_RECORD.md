# Releases Migration Record

Status: Consolidated historical migration record
Last Updated: 2026-07-10

## Purpose

This record consolidates the prior compatibility map, migration manifest, rollback checklist, and validation checklist artifacts for this registry area. The original source files are retained in `archive/governance-history/` for audit history.

## Source Files

- Original: `releases/RELEASE_COMPATIBILITY_MAP.md` -> Archive: `archive/governance-history/releases/RELEASE_COMPATIBILITY_MAP.md`
- Original: `releases/RELEASE_REGISTRY_MANIFEST.md` -> Archive: `archive/governance-history/releases/RELEASE_REGISTRY_MANIFEST.md`
- Original: `releases/RELEASE_ROLLBACK_CHECKLIST.md` -> Archive: `archive/governance-history/releases/RELEASE_ROLLBACK_CHECKLIST.md`
- Original: `releases/RELEASE_VALIDATION_CHECKLIST.md` -> Archive: `archive/governance-history/releases/RELEASE_VALIDATION_CHECKLIST.md`

---

## Source: RELEASE_COMPATIBILITY_MAP.md

Original path: `releases/RELEASE_COMPATIBILITY_MAP.md`
Archived path: `archive/governance-history/releases/RELEASE_COMPATIBILITY_MAP.md`

# Release Compatibility Map

Project: Repository Architecture Reset v1.0
Migration Unit: MU-003 Release Registry Migration
Status: Review map

## Purpose

This map defines compatibility handling for release discovery during and after future release package migration.

## Compatibility Principles

1. Current release package paths remain active.
2. Future target paths are registry mappings only until implemented.
3. Original release identifiers are preserved.
4. Release package content is immutable.
5. Old-path compatibility is required before any future release package movement.

## Compatibility Actions

| Current Path Family | Future Target Family | Compatibility Action |
| --- | --- | --- |
| `docs/nextshift-os-3/business-os/releases/BUSINESS_OS_v1.0/` | `releases/business-os/v1.0/` | Retain old-path index or stub after approved movement |
| `docs/nextshift-os-3/ai/releases/AI_ENGINEERING_FOUNDATION_v1.0/` | `releases/ai-engineering-foundation/v1.0/` | Retain old-path index or stub after approved movement |
| `docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.0/` | `releases/engineering-standards/v1.0/` | Retain old-path index or stub after approved movement |
| `docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/` | `releases/engineering-standards/v1.1/` | Retain old-path index or stub after approved movement |
| Project release files | `releases/{domain}/v{semver}/` | Classify before movement |

## Old-Path Stub Pattern

```text
# Release Package Moved

This release package has moved to:

`releases/{domain}/v{semver}/`

Original release identifier:

`{ORIGINAL_RELEASE_IDENTIFIER}`

The original path is retained for compatibility with historical links,
release records, audit evidence, and AI prompts.
```

## Release Identifier Preservation

Future canonical paths use lowercase domain names and semantic versions. Original identifiers remain in metadata or manifests:

- `BUSINESS_OS_v1.0`
- `AI_ENGINEERING_FOUNDATION_v1.0`
- `ENGINEERING_STANDARDS_v1.0`
- `ENGINEERING_STANDARDS_v1.1`

## Compatibility Validation

- Current release path resolves.
- Future target path is listed in `RELEASE_REGISTRY_MANIFEST.md`.
- Original identifier is retained.
- Release package content is unchanged.
- `releases/index.md` links current package path.
- Audit evidence remains discoverable through [audit/index.md](../audit/index.md).

---

## Source: RELEASE_REGISTRY_MANIFEST.md

Original path: `releases/RELEASE_REGISTRY_MANIFEST.md`
Archived path: `archive/governance-history/releases/RELEASE_REGISTRY_MANIFEST.md`

# Release Registry Manifest

Project: Repository Architecture Reset v1.0
Migration Unit: MU-003 Release Registry Migration
Status: Review manifest

## Purpose

This manifest maps current release package locations to future canonical release paths. It is a registry artifact only; it does not move release packages.

## Release Package Map

| Release | Current Path | Original Identifier | Future Target Path | Status |
| --- | --- | --- | --- | --- |
| Business OS v1.0 | `docs/nextshift-os-3/business-os/releases/BUSINESS_OS_v1.0/` | `BUSINESS_OS_v1.0` | `releases/business-os/v1.0/` | Current path active |
| AI Engineering Foundation v1.0 | `docs/nextshift-os-3/ai/releases/AI_ENGINEERING_FOUNDATION_v1.0/` | `AI_ENGINEERING_FOUNDATION_v1.0` | `releases/ai-engineering-foundation/v1.0/` | Current path active |
| Engineering Standards v1.0 | `docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.0/` | `ENGINEERING_STANDARDS_v1.0` | `releases/engineering-standards/v1.0/` | Current path active |
| Engineering Standards v1.1 | `docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/` | `ENGINEERING_STANDARDS_v1.1` | `releases/engineering-standards/v1.1/` | Current path active |

## Project Release Reference Map

| Project | Current Release Reference | Future Target Path | Status |
| --- | --- | --- | --- |
| Design System | `docs/nextshift-os-3/design-system/PROJECT_RELEASE.md` | `releases/design-system/v1.0/` | Current path active |
| UI Kit | `docs/nextshift-os-3/ui-kit/UIKIT_V1_RELEASE_PACKAGE.md` | `releases/ui-kit/v1.0/` | Current path active |
| Workspace Experience Framework | `docs/nextshift-os-3/workspace-experience-framework/PROJECT_RELEASE.md` | `releases/workspace-experience-framework/v1.0/` | Current path active |
| Capabilities | `docs/nextshift-os-3/capabilities/RELEASE_TAGS.md` | `releases/capabilities/` | Current path active |

## Required Release Package Metadata Preservation

- Original release identifier.
- Release manifest.
- Release notes.
- Approval or authorization records.
- Audit report, when present.
- Completion or handoff records, when present.

## Excluded From MU-003

| Area | Reason |
| --- | --- |
| Release package file movement | Requires separate approval |
| Release package content rewriting | Violates immutability boundary |
| Tags and release branches | Release governance and GitHub alignment required |
| Production deployment | Out of scope |
| Runtime files | Runtime migration excluded |
| Governance files | MU-002 scope |
| Audit files | MU-004 scope |

---

## Source: RELEASE_ROLLBACK_CHECKLIST.md

Original path: `releases/RELEASE_ROLLBACK_CHECKLIST.md`
Archived path: `archive/governance-history/releases/RELEASE_ROLLBACK_CHECKLIST.md`

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

---

## Source: RELEASE_VALIDATION_CHECKLIST.md

Original path: `releases/RELEASE_VALIDATION_CHECKLIST.md`
Archived path: `archive/governance-history/releases/RELEASE_VALIDATION_CHECKLIST.md`

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

---
