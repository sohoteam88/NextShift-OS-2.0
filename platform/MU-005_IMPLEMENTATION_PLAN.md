# MU-005 Implementation Plan

Project: Repository Architecture Reset v1.0
Migration Unit: MU-005 Platform Project Migration
Status: Implementation package for Chief Repository Architect review

## Purpose

This plan prepares migration of platform project documentation into the canonical `platform/projects/` structure. It does not move existing project folders.

## Scope

Included:

- Platform project migration planning.
- Project source-to-target path mapping.
- Lifecycle artifact preservation.
- Compatibility planning.
- Validation and rollback planning.

Excluded:

- Runtime migration.
- Release package migration.
- Governance migration.
- Audit migration.
- Code refactoring.
- Production or deployment changes.

## Current Project Sources

- [Business OS](../docs/nextshift-os-3/business-os/README.md)
- [UI Kit](../docs/nextshift-os-3/ui-kit/README.md)
- [Workspace Experience Framework](../docs/nextshift-os-3/workspace-experience-framework/README.md)
- [AI Engineering](../docs/nextshift-os-3/ai/README.md)
- [Design System](../docs/nextshift-os-3/design-system/README.md)

## Future Project Structure

```text
platform/projects/
  business-os/
  ui-kit/
  workspace-experience-framework/
  ai-engineering-foundation/
  design-system/
  repository-architecture-reset/
```

## Implementation Sequence

1. Keep `platform/index.md` as the project migration entry point.
2. Record project source-to-target mappings in `PLATFORM_PROJECT_MIGRATION_MANIFEST.md`.
3. Record old-path compatibility rules in `PLATFORM_PROJECT_COMPATIBILITY_MAP.md`.
4. Preserve lifecycle artifact names and release/audit references.
5. Validate local links.
6. Hand off package for implementation review before any future file movement.

## Migration Boundary

No project documentation folders are moved by MU-005. Future movement requires approved `git mv` operations, compatibility stubs, artifact count checks, and registry updates.

## Preservation Rule

Platform project lifecycle artifacts remain evidence of completed work. Planning, implementation, verification, audit, release, and handoff files must remain discoverable before, during, and after any future migration.
