# Audit Compatibility Map

Project: Repository Architecture Reset v1.0
Migration Unit: MU-004 Audit Registry Migration
Status: Review map

## Purpose

This map defines compatibility handling for audit discovery during and after any future audit taxonomy migration.

## Compatibility Principles

1. Current audit paths remain active.
2. Future taxonomy paths are registry mappings only until implemented.
3. Original audit filenames remain discoverable.
4. Audit reports are immutable evidence.
5. Old-path compatibility is required before any future audit movement.

## Compatibility Actions

| Current Path Family | Future Target Family | Compatibility Action |
| --- | --- | --- |
| `audit/RAR-*_REPOSITORY_AUDIT_REPORT.md` | `audit/repository/rar/` | Retain old-path link or stub after approved movement |
| `audit/BOS_*_AUDIT_REPORT.md` | `audit/business-os/` | Retain old-path link or stub after approved movement |
| `audit/CAP_*_AUDIT_REPORT.md` | `audit/capabilities/` | Retain old-path link or stub after approved movement |
| `audit/BUSINESS_OS_v1.0_RELEASE_PACKAGE_AUDIT_REPORT.md` | `audit/releases/business-os/v1.0/` | Retain old-path link or stub after approved movement |
| `docs/audit/ARC_*_AUDIT_REPORT.md` | `audit/platform/architecture/` | Retain docs/audit compatibility index |
| `docs/nextshift-os-3/**/AUDIT_REPORT.md` | Domain-specific audit taxonomy | Classify before movement |
| Legacy and dependency audit files | `audit/historical/` | Retain historical path or stub after approved movement |

## Old-Path Stub Pattern

```text
# Audit Evidence Moved

This audit evidence has moved to:

`audit/{taxonomy}/{artifact}`

Original audit filename:

`{ORIGINAL_AUDIT_FILENAME}`

The original path is retained for compatibility with historical links,
release records, project documentation, and AI prompts.
```

## Evidence Preservation Requirements

- Do not rewrite audit findings.
- Do not reinterpret audit result.
- Do not delete audit evidence.
- Preserve original filenames in compatibility metadata.
- Keep release audits discoverable from both audit and release registries.

## Compatibility Validation

- Current audit path resolves.
- Future taxonomy path is listed in `AUDIT_REGISTRY_MANIFEST.md`.
- Original filename is retained.
- Audit report content is unchanged.
- `audit/index.md` links current evidence family.
- Companion registries remain reachable.
