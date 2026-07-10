# Platform Structure Validation Checklist

Project: Repository Modernization Program v1.0
Wave: RMP-002 Platform Structure Migration
Status: Implementation package for review

## Purpose

This checklist defines validation required for the RMP-002 Platform Structure Migration implementation package.

## File Presence

| Check | Expected Result | Status |
| --- | --- | --- |
| `platform/RMP-002_IMPLEMENTATION_PLAN.md` exists | File present | Pending review |
| `platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md` exists | File present | Pending review |
| `platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md` exists | File present | Pending review |
| `platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md` exists | File present | Pending review |
| `platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md` exists | File present | Pending review |

## Required Git Validation

Run:

```text
git status --short
git diff --check
git diff --cached --check
```

Expected results:

- RMP-002 package files appear as untracked or staged additions.
- `git diff --check` reports no whitespace errors.
- `git diff --cached --check` reports no whitespace errors.

## Markdown Link Validation

Validate local links in:

- [RMP-002 Implementation Plan](RMP-002_IMPLEMENTATION_PLAN.md)
- [Platform Structure Migration Manifest](PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md)
- [Platform Structure Compatibility Map](PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md)
- [Platform Structure Validation Checklist](PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md)
- [Platform Structure Rollback Checklist](PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md)

Expected result:

- All local markdown links resolve.
- External link validation is not required because this package does not introduce external links.

## Boundary Validation

| Boundary | Expected Result |
| --- | --- |
| Runtime migration | Not present |
| Governance migration | Not present |
| Release package movement | Not present |
| Audit taxonomy migration | Not present |
| Cleanup | Not present |
| Deployment | Not present |
| Commit or push | Not performed |

## Compatibility Validation

Validate that:

- Current `docs/nextshift-os-3` paths remain active.
- [Platform Index](index.md) remains discoverable.
- [Platform Status](status.md) remains discoverable.
- Future target paths are labeled as future targets.
- Old-path retirement is not requested.

## Review Readiness

The package is ready for review when:

- All five package files exist.
- Git validation passes.
- Local markdown link validation passes.
- No runtime or protected artifact changes are present.
- Rollback checklist is complete.
