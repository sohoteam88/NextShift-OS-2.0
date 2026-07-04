# Platform Index

Status: Finalized registry
Project: Repository Architecture Reset v1.0
Migration Unit: MU-001 Platform Registry Migration

## Purpose

This registry is the canonical platform navigation entry point for repository architecture migration. It provides repository-first navigation for humans and AI agents while preserving current source paths.

## Registry-First Contract

- Current paths remain canonical until a later approved migration phase changes them.
- This file is a navigation registry only.
- No project folders have been moved by MU-001.
- No governance, release, or audit assets have been migrated by MU-001.
- Runtime code remains under its existing paths.
- `src/*` to `apps/web/*` is deferred to a separate runtime migration lifecycle.

## Canonical Navigation Flow

```text
platform/index.md
  -> platform/status.md
  -> governance/index.md, releases/index.md, or audit/index.md
  -> current source-of-truth document
  -> lifecycle artifact in scope
```

Use this registry before loading deep project documentation unless the operator provides a specific current lifecycle artifact.

## Current Platform Entry Points

| Area | Current Path |
| --- | --- |
| NextShift OS documentation root | [docs/nextshift-os-3/README.md](../docs/nextshift-os-3/README.md) |
| Master index | [docs/nextshift-os-3/MASTER_INDEX.md](../docs/nextshift-os-3/MASTER_INDEX.md) |
| Project status | [docs/nextshift-os-3/PROJECT_STATUS.md](../docs/nextshift-os-3/PROJECT_STATUS.md) |
| Project roadmap | [docs/nextshift-os-3/PROJECT_ROADMAP.md](../docs/nextshift-os-3/PROJECT_ROADMAP.md) |
| Implementation roadmap | [docs/nextshift-os-3/IMPLEMENTATION_MASTER_ROADMAP.md](../docs/nextshift-os-3/IMPLEMENTATION_MASTER_ROADMAP.md) |
| Capability status | [docs/nextshift-os-3/CAPABILITY_STATUS.md](../docs/nextshift-os-3/CAPABILITY_STATUS.md) |
| Runtime status | [docs/nextshift-os-3/RUNTIME_STATUS.md](../docs/nextshift-os-3/RUNTIME_STATUS.md) |

## Platform Project Registry

| Project | Current Path | Current State |
| --- | --- | --- |
| Business OS | [docs/nextshift-os-3/business-os/README.md](../docs/nextshift-os-3/business-os/README.md) | Business OS v1.0 released |
| UI Kit | [docs/nextshift-os-3/ui-kit/README.md](../docs/nextshift-os-3/ui-kit/README.md) | Released |
| Workspace Experience Framework | [docs/nextshift-os-3/workspace-experience-framework/README.md](../docs/nextshift-os-3/workspace-experience-framework/README.md) | WEF v1.0 released |
| AI Engineering | [docs/nextshift-os-3/ai/README.md](../docs/nextshift-os-3/ai/README.md) | AI Engineering Foundation released |
| Design System | [docs/nextshift-os-3/design-system/README.md](../docs/nextshift-os-3/design-system/README.md) | Released |
| Repository Architecture Reset | [platform/status.md](status.md) | MU-001 platform registry finalized |

## Platform Project Migration Package

| Artifact | Purpose |
| --- | --- |
| [MU-005 Implementation Plan](MU-005_IMPLEMENTATION_PLAN.md) | Defines the platform project migration package for review |
| [Platform Project Migration Manifest](PLATFORM_PROJECT_MIGRATION_MANIFEST.md) | Maps current project documentation paths to future target paths |
| [Platform Project Compatibility Map](PLATFORM_PROJECT_COMPATIBILITY_MAP.md) | Defines old-path compatibility and lifecycle artifact preservation |
| [Platform Project Validation Checklist](PLATFORM_PROJECT_VALIDATION_CHECKLIST.md) | Lists validation gates for platform project migration |
| [Platform Project Rollback Checklist](PLATFORM_PROJECT_ROLLBACK_CHECKLIST.md) | Defines rollback readiness for future project movement |

## Architecture and Decision Records

| Area | Current Path |
| --- | --- |
| Architecture docs | [docs/nextshift-os-3/phase-2-architecture/README.md](../docs/nextshift-os-3/phase-2-architecture/README.md) |
| ADR registry | [docs/nextshift-os-3/adr/README.md](../docs/nextshift-os-3/adr/README.md) |
| RFC registry | [docs/nextshift-os-3/rfc/README.md](../docs/nextshift-os-3/rfc/README.md) |
| Governance docs | [docs/nextshift-os-3/governance/README.md](../docs/nextshift-os-3/governance/README.md) |

## Companion Registries

- [Platform status](status.md)
- [Governance index](../governance/index.md)
- [Release index](../releases/index.md)
- [Audit index](../audit/index.md)

## Compatibility Notes

- Existing `docs/nextshift-os-3` links remain active.
- This registry does not replace `docs/nextshift-os-3/MASTER_INDEX.md`; it provides the migration-era platform entry point.
- Future target paths must remain labeled as future targets until implemented and validated.
- Release package discovery remains delegated to [releases/index.md](../releases/index.md).
- Audit evidence discovery remains delegated to [audit/index.md](../audit/index.md).
