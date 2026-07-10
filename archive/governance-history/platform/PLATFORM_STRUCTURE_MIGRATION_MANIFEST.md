# Platform Structure Migration Manifest

Project: Repository Modernization Program v1.0
Wave: RMP-002 Platform Structure Migration
Status: Implementation package for review

## Purpose

This manifest defines the approved Platform Structure Migration package inventory and future migration boundaries.

## Manifest Scope

This Stop A manifest records package creation only. It does not authorize project folder movement, runtime migration, governance migration, release movement, audit migration, cleanup, deployment, commit, or push.

## Package Files

| File | Purpose | Action |
| --- | --- | --- |
| [RMP-002 Implementation Plan](RMP-002_IMPLEMENTATION_PLAN.md) | Defines wave scope and execution plan | Create |
| [Platform Structure Migration Manifest](PLATFORM_STRUCTURE_MIGRATION_MANIFEST.md) | Defines package inventory and migration boundaries | Create |
| [Platform Structure Compatibility Map](PLATFORM_STRUCTURE_COMPATIBILITY_MAP.md) | Maps current paths to compatibility handling | Create |
| [Platform Structure Validation Checklist](PLATFORM_STRUCTURE_VALIDATION_CHECKLIST.md) | Defines required validation gates | Create |
| [Platform Structure Rollback Checklist](PLATFORM_STRUCTURE_ROLLBACK_CHECKLIST.md) | Defines rollback readiness | Create |

## Current Source Inventory

| Source Path | Classification | RMP-002 Action |
| --- | --- | --- |
| [platform/index.md](index.md) | Platform registry | Retain |
| [platform/status.md](status.md) | Platform status registry | Retain |
| [docs/nextshift-os-3/README.md](../docs/nextshift-os-3/README.md) | Documentation root | Retain |
| [docs/nextshift-os-3/MASTER_INDEX.md](../docs/nextshift-os-3/MASTER_INDEX.md) | Master index | Retain |
| [docs/nextshift-os-3/PROJECT_STATUS.md](../docs/nextshift-os-3/PROJECT_STATUS.md) | Project status | Retain |
| [docs/nextshift-os-3/PROJECT_ROADMAP.md](../docs/nextshift-os-3/PROJECT_ROADMAP.md) | Project roadmap | Retain |
| [docs/nextshift-os-3/CAPABILITY_STATUS.md](../docs/nextshift-os-3/CAPABILITY_STATUS.md) | Capability status | Retain |
| [docs/nextshift-os-3/RUNTIME_STATUS.md](../docs/nextshift-os-3/RUNTIME_STATUS.md) | Runtime status | Retain, runtime migration excluded |

## Future Target Inventory

Future targets are planning targets only until a later approved execution package authorizes movement.

| Future Target | Intended Purpose | Current Status |
| --- | --- | --- |
| `platform/projects/` | Future platform project registry domain | Not created by this package |
| `platform/architecture/` | Future platform architecture navigation domain | Not created by this package |
| `platform/registry/` | Future registry support domain | Not created by this package |
| `platform/status/` | Future status support domain | Not created by this package |

## Compatibility Actions

| Action | Path | Requirement |
| --- | --- | --- |
| Retain | `docs/nextshift-os-3/*` | Existing links remain active |
| Retain | `platform/index.md` | Remains current platform entry point |
| Retain | `platform/status.md` | Remains current status entry point |
| Map | Future target paths | Must remain labeled future targets until implemented |
| Stub | Old paths after future movement | Required before old-path retirement |

## Protected Artifacts

RMP-002 must not move or rewrite:

- Release packages.
- Audit reports.
- Governance standards.
- Runtime source files.
- Database migrations.
- Deployment configuration.
- Existing lifecycle artifacts outside the approved platform package.

## Validation Evidence Required

RMP-002 review requires:

- Package file presence check.
- `git status --short`.
- `git diff --check`.
- `git diff --cached --check`.
- Local markdown link validation.

## Manifest Decision

RMP-002 is an implementation package for review. The package records the platform structure migration approach but does not execute repository movement.
