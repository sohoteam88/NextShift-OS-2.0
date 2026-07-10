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
