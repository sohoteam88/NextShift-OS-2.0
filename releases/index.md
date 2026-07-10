# Release Index

Status: MU-003 implementation package
Project: Repository Architecture Reset v1.0
Migration Unit: MU-003 Release Registry Migration

## Purpose

This registry is the canonical release discovery layer for RepoOS migration. It preserves immutable release packages at their current repository paths while documenting future canonical release path mappings.

## Registry-First Boundary

- Existing release package paths remain unchanged.
- No release package files have been moved or renamed.
- No release package content has been rewritten.
- No tags, release branches, production deployments, runtime files, governance assets, or audit files are changed by MU-003.
- This index records current release locations, compatibility metadata, and future target path mappings.

## MU-003 Implementation Package

| Artifact | Purpose |
| --- | --- |
| [MU-003 Implementation Plan](MU-003_IMPLEMENTATION_PLAN.md) | Defines the release registry implementation package for review |
| [Release Migration Record](MIGRATION_RECORD.md) | Consolidates the release registry manifest, compatibility map, validation checklist, and rollback checklist |

## Target Release Path Standard

Future canonical release package paths should use:

```text
releases/{domain}/v{semver}/
```

Original release identifiers should remain in release metadata or release manifests.

## Current Release Packages

| Release Package | Current Path | Original Identifier | Future Target Pattern |
| --- | --- | --- | --- |
| Business OS v1.0 | [docs/nextshift-os-3/business-os/releases/BUSINESS_OS_v1.0/README.md](../docs/nextshift-os-3/business-os/releases/BUSINESS_OS_v1.0/README.md) | `BUSINESS_OS_v1.0` | `releases/business-os/v1.0/` |
| AI Engineering Foundation v1.0 | [docs/nextshift-os-3/ai/releases/AI_ENGINEERING_FOUNDATION_v1.0/README.md](../docs/nextshift-os-3/ai/releases/AI_ENGINEERING_FOUNDATION_v1.0/README.md) | `AI_ENGINEERING_FOUNDATION_v1.0` | `releases/ai-engineering-foundation/v1.0/` |
| Engineering Standards v1.0 | [docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md](../docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md) | `ENGINEERING_STANDARDS_v1.0` | `releases/engineering-standards/v1.0/` |
| Engineering Standards v1.1 | [docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/README.md](../docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/README.md) | `ENGINEERING_STANDARDS_v1.1` | `releases/engineering-standards/v1.1/` |

## Project Release References

| Project | Current Release Reference |
| --- | --- |
| Design System | [docs/nextshift-os-3/design-system/PROJECT_RELEASE.md](../docs/nextshift-os-3/design-system/PROJECT_RELEASE.md) |
| UI Kit | [docs/nextshift-os-3/ui-kit/UIKIT_V1_RELEASE_PACKAGE.md](../docs/nextshift-os-3/ui-kit/UIKIT_V1_RELEASE_PACKAGE.md) |
| Workspace Experience Framework | [docs/nextshift-os-3/workspace-experience-framework/PROJECT_RELEASE.md](../docs/nextshift-os-3/workspace-experience-framework/PROJECT_RELEASE.md) |
| Capabilities | [docs/nextshift-os-3/capabilities/RELEASE_TAGS.md](../docs/nextshift-os-3/capabilities/RELEASE_TAGS.md) |

## Release Governance

| Governance Artifact | Current Path |
| --- | --- |
| STD-004 Release Governance | [docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md](../docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md) |
| STD-005 GitHub Alignment Standard | [docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md) |
| Project status dashboard | [docs/nextshift-os-3/PROJECT_STATUS.md](../docs/nextshift-os-3/PROJECT_STATUS.md) |

## Companion Registries

- [Platform index](../platform/index.md)
- [Platform status](../platform/status.md)
- [Governance index](../governance/index.md)
- [Audit index](../audit/index.md)

## Compatibility Notes

- Current release paths remain active until a separate approved release package migration executes.
- Future target paths are registry mappings only.
- Release package contents and original identifiers remain immutable.
- Release branch creation, tag creation, and production deployment are outside MU-003 scope.
- Audit evidence for releases remains discoverable through [audit/index.md](../audit/index.md).
