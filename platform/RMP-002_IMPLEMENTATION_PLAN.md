# RMP-002 Implementation Plan

Project: Repository Modernization Program v1.0
Wave: RMP-002 Platform Structure Migration
Status: Implementation package for review
Execution Mode: Package-only, no file movement

## Purpose

This plan defines the Platform Structure Migration implementation package for Chief Repository Architect review.

## Authority

This package follows:

- [Platform Index](index.md)
- [Platform Status](status.md)
- [Repository Architecture Freeze](../governance/repository/REPOSITORY_ARCHITECTURE_FREEZE.md)
- [Migration Freeze Matrix](../governance/repository/MIGRATION_FREEZE_MATRIX.md)
- [RMP Execution Framework](../governance/repository/RMP_EXECUTION_FRAMEWORK.md)
- [Modernization Execution Standard](../governance/repository/MODERNIZATION_EXECUTION_STANDARD.md)

## Scope

Included:

- Platform documentation structure migration planning.
- Platform registry update plan.
- Compatibility stub plan.
- Migration manifest.
- Validation checklist.
- Rollback checklist.

Excluded:

- Runtime migration.
- Governance migration.
- Release package movement.
- Audit taxonomy migration.
- Cleanup.
- Deployment.
- Commit or push.

## Current Platform Structure

| Area | Current Path | Current Handling |
| --- | --- | --- |
| Platform registry | [platform/index.md](index.md) | Retain as current platform entry point |
| Platform status | [platform/status.md](status.md) | Retain as current status registry |
| Platform project migration package | `platform/PLATFORM_PROJECT_*` | Retain as RepoOS MU-005 planning package |
| NextShift OS docs root | [docs/nextshift-os-3/README.md](../docs/nextshift-os-3/README.md) | Retain current source-of-truth path |
| Master index | [docs/nextshift-os-3/MASTER_INDEX.md](../docs/nextshift-os-3/MASTER_INDEX.md) | Retain current source-of-truth path |
| Project status | [docs/nextshift-os-3/PROJECT_STATUS.md](../docs/nextshift-os-3/PROJECT_STATUS.md) | Retain current source-of-truth path |

## Proposed Platform Structure

RMP-002 prepares the platform structure model without moving source project documentation in this Stop A package.

```text
platform/
  index.md
  status.md
  RMP-002_IMPLEMENTATION_PLAN.md
  PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md
  PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md
  PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md
  PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md
```

Future execution waves may introduce deeper platform domains only after compatibility and rollback evidence exists.

## File Actions

| Action | Path | Status |
| --- | --- | --- |
| Create | `platform/RMP-002_IMPLEMENTATION_PLAN.md` | In package |
| Create | `platform/PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md` | In package |
| Create | `platform/PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md` | In package |
| Create | `platform/PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md` | In package |
| Create | `platform/PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md` | In package |
| Move | Project documentation folders | Not authorized |
| Delete | Any repository file | Not authorized |

## Registry Update Plan

Registry updates for a future execution pass must:

- Preserve [platform/index.md](index.md) as the platform navigation entry point.
- Preserve [platform/status.md](status.md) as the platform status entry point.
- Add links to approved RMP-002 package artifacts only after review.
- Keep existing `docs/nextshift-os-3` source paths discoverable.
- Avoid governance, release, audit, runtime, cleanup, and deployment changes.

## Compatibility Plan

Compatibility is defined in [Platform Structure Compatibility Map](PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md).

The central rule is:

```text
current docs/nextshift-os-3 paths remain active until a later approved migration creates validated target paths and compatibility stubs.
```

## Validation Plan

Validation is defined in [Platform Structure Validation Checklist](PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md).

Required commands:

```text
git status --short
git diff --check
git diff --cached --check
```

Local markdown link validation is required for all RMP-002 package files.

## Rollback Plan

Rollback is defined in [Platform Structure Rollback Checklist](PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md).

Because this Stop A package creates documentation-only implementation package files and performs no file movement, rollback is limited to removing the five RMP-002 package files if explicitly authorized.

## Stop Conditions

Stop immediately if:

- Runtime migration appears in scope.
- Governance migration appears in scope.
- Release package movement appears in scope.
- Audit taxonomy migration appears in scope.
- Cleanup appears in scope.
- Validation fails.
- Compatibility cannot be proven.

## Review Handoff

This package is ready for Chief Repository Architect review when:

- All five package files exist.
- Local markdown links validate.
- `git diff --check` passes.
- `git diff --cached --check` passes.
- No commit or push has occurred.
