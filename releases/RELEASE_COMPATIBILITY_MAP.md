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
