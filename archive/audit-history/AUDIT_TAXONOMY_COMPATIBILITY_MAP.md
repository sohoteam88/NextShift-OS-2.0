# Audit Taxonomy Compatibility Map

Project: Repository Modernization Program v1.0
Wave: RMP-004 Audit Taxonomy Migration
Status: Implementation package for review

## Purpose

This compatibility map preserves current audit evidence paths while defining future audit taxonomy handling.

## Compatibility Principle

Audit evidence remains immutable and discoverable at current paths until future taxonomy paths exist, registries link to them, original filenames are preserved, and old-path retirement is separately approved.

## Compatibility Map

| Current Path Family | Future Taxonomy Target | Artifact Class | RMP-004 Action | Retirement Status |
| --- | --- | --- | --- | --- |
| [audit/index.md](index.md) | `audit/index.md` | Audit registry | Retain | Not eligible |
| [AUDIT_REGISTRY_MANIFEST.md](AUDIT_REGISTRY_MANIFEST.md) | `audit/AUDIT_REGISTRY_MANIFEST.md` | Audit registry manifest | Retain | Not eligible |
| [AUDIT_COMPATIBILITY_MAP.md](AUDIT_COMPATIBILITY_MAP.md) | `audit/AUDIT_COMPATIBILITY_MAP.md` | Audit compatibility map | Retain | Not eligible |
| `audit/RAR-*_REPOSITORY_AUDIT_REPORT.md` | `audit/repository/rar/` | Repository Architecture Reset audit evidence | Map only | Not eligible |
| `audit/RAF-*_REPOSITORY_ARCHITECTURE_FREEZE_*AUDIT_REPORT.md` | `audit/repository/freeze/` | Repository Architecture Freeze audit evidence | Map only | Not eligible |
| `audit/RMP-*_REPOSITORY_MIGRATION_*AUDIT_REPORT.md` | `audit/repository/rmp/` | Repository Modernization Program audit evidence | Map only | Not eligible |
| `audit/ARCHITECTURE_*` | `audit/repository/` | Architecture audit evidence | Map only | Not eligible |
| `audit/PACKAGE_*` | `audit/repository/` | Package audit evidence | Map only | Not eligible |
| `audit/BOS_*_AUDIT_REPORT.md` | `audit/business-os/` | Business OS audit evidence | Map only | Not eligible |
| `audit/BUSINESS_OS_v1.0_RELEASE_PACKAGE_AUDIT_REPORT.md` | `audit/releases/business-os/v1.0/` | Release audit evidence | Map only | Not eligible |
| `audit/CAP_*_AUDIT_REPORT.md` | `audit/capabilities/` | Capability audit evidence | Map only | Not eligible |
| `audit/DS_*_AUDIT_REPORT.md` | `audit/platform/design-system/` | Design System audit evidence | Map only | Not eligible |
| `audit/NEXTSHIFT_DESIGN_SYSTEM_*` | `audit/platform/design-system/` | Design System audit evidence | Map only | Not eligible |
| `audit/UK_*_AUDIT_REPORT.md` | `audit/platform/ui-kit/` | UI Kit audit evidence | Map only | Not eligible |
| `audit/UIKIT_*` | `audit/platform/ui-kit/` | UI Kit audit evidence | Map only | Not eligible |
| `audit/UI_*` | `audit/platform/ui-kit/` | UI Kit audit evidence | Map only | Not eligible |
| `audit/WEF_*_AUDIT_REPORT.md` | `audit/platform/workspace-experience/` | Workspace Experience audit evidence | Map only | Not eligible |
| `audit/LEGACY_*` | `audit/historical/` | Legacy audit evidence | Map only | Not eligible |
| `audit/*DEPENDENCY*` | `audit/historical/` | Dependency audit evidence | Map only | Not eligible |
| `audit/*MIGRATION*` | `audit/historical/` | Historical migration evidence | Map only | Not eligible |
| `docs/audit/ARC_*` | `audit/platform/architecture/` | Architecture milestone audit evidence | Map only | Not eligible |
| `docs/nextshift-os-3/**/AUDIT_REPORT.md` | Domain-specific audit taxonomy | Project-local audit evidence | Classify before movement | Not eligible |

## Stub Rules

Compatibility stubs are required before any future audit evidence path is retired.

Stub content must include:

- Original audit filename.
- Original audit path.
- New taxonomy path.
- Evidence preservation statement.
- Link to [Audit Index](index.md).
- Retirement approval reference.

## Registry Rules

Future registry updates must:

- Preserve [Audit Index](index.md).
- Link RMP-004 package artifacts only after review approval.
- Keep current audit evidence paths discoverable until movement executes.
- Preserve original audit filenames in manifests and compatibility metadata.
- Keep release package discovery delegated to [Release Index](../releases/index.md).
- Keep governance discovery delegated to [Governance Index](../governance/index.md).
- Keep platform discovery delegated to [Platform Index](../platform/index.md).

## Evidence Preservation Requirements

RMP-004 compatibility must preserve:

- Original audit findings.
- Original audit result.
- Original filename.
- Original path or compatibility path.
- Associated project, capability, release, or migration unit.
- Historical links from release and project records.

## Stop Conditions

Stop if:

- Audit evidence content would be rewritten.
- Audit evidence would be deleted.
- Audit result would be reinterpreted.
- A release or project reference becomes undiscoverable.
- Runtime migration is introduced.
- A future target is treated as active before implementation.
- Old-path retirement is attempted without approval.

## Compatibility Decision

RMP-004 maps audit taxonomy compatibility but does not retire, delete, rewrite, reinterpret, or move any existing audit evidence path.
