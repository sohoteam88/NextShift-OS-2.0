# Platform Project Compatibility Map

Project: Repository Architecture Reset v1.0
Migration Unit: MU-005 Platform Project Migration
Status: Review map

## Purpose

This map defines compatibility handling for future migration of platform project documentation into `platform/projects/`.

## Compatibility Principles

1. Current project paths remain active until approved migration executes.
2. Future target paths are planned targets only until implemented and validated.
3. Old-path compatibility stubs are required for moved project roots.
4. Release package discovery remains delegated to [releases/index.md](../releases/index.md).
5. Audit evidence discovery remains delegated to [audit/index.md](../audit/index.md).
6. Runtime paths are not touched by MU-005.

## Compatibility Actions

| Current Path | Future Target Path | Compatibility Action |
| --- | --- | --- |
| `docs/nextshift-os-3/business-os/` | `platform/projects/business-os/` | Retain old-path README or stub after approved movement |
| `docs/nextshift-os-3/ui-kit/` | `platform/projects/ui-kit/` | Retain old-path README or stub after approved movement |
| `docs/nextshift-os-3/workspace-experience-framework/` | `platform/projects/workspace-experience-framework/` | Retain old-path README or stub after approved movement |
| `docs/nextshift-os-3/ai/` | `platform/projects/ai-engineering-foundation/` | Classify AI governance, prompts, knowledge, and release docs before movement |
| `docs/nextshift-os-3/design-system/` | `platform/projects/design-system/` | Retain old-path README or stub after approved movement |

## Old-Path Stub Pattern

```text
# Platform Project Moved

This platform project has moved to:

`platform/projects/{project}/`

The original path is retained for compatibility with historical links,
release records, audit evidence, and AI prompts.
```

## Link Preservation

Future migration must preserve links to:

- Release registry.
- Audit registry.
- Governance registry.
- Project release packages.
- Project audit reports.
- Requirements verification artifacts.
- Slice and lifecycle README files.

## Compatibility Validation

- Current project path resolves.
- Future target path is listed in `PLATFORM_PROJECT_MIGRATION_MANIFEST.md`.
- Lifecycle artifact count is preserved.
- Release package links remain discoverable.
- Audit links remain discoverable.
- `platform/index.md` links the project or compatibility path.
