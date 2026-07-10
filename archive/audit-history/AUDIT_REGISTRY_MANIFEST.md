# Audit Registry Manifest

Project: Repository Architecture Reset v1.0
Migration Unit: MU-004 Audit Registry Migration
Status: Review manifest

## Purpose

This manifest maps current audit evidence families to future taxonomy targets. It is a registry artifact only; it does not move or rewrite audit evidence.

## Audit Evidence Family Map

| Evidence Family | Current Path Pattern | Future Taxonomy Target | Status |
| --- | --- | --- | --- |
| Repository Architecture Reset audits | `audit/RAR-*_REPOSITORY_AUDIT_REPORT.md` | `audit/repository/rar/` | Current path active |
| Architecture freeze and repository hygiene | `audit/ARCHITECTURE_*`, `audit/REPO_*`, `audit/PACKAGE_*` | `audit/repository/` | Current path active |
| Business OS audits | `audit/BOS_*_AUDIT_REPORT.md` | `audit/business-os/` | Current path active |
| Business OS release audit | `audit/BUSINESS_OS_v1.0_RELEASE_PACKAGE_AUDIT_REPORT.md` | `audit/releases/business-os/v1.0/` | Current path active |
| Capability audits | `audit/CAP_*_AUDIT_REPORT.md` | `audit/capabilities/` | Current path active |
| Design System audits | `audit/DS_*_AUDIT_REPORT.md`, `audit/NEXTSHIFT_DESIGN_SYSTEM_*` | `audit/platform/design-system/` | Current path active |
| UI Kit audits | `audit/UK_*_AUDIT_REPORT.md`, `audit/UIKIT_*`, `audit/UI_*` | `audit/platform/ui-kit/` | Current path active |
| Architecture milestone audits | `docs/audit/ARC_*_AUDIT_REPORT.md` | `audit/platform/architecture/` | Current path active |
| Project-local audit reports | `docs/nextshift-os-3/**/AUDIT_REPORT.md` | Domain-specific audit taxonomy | Current path active |
| Legacy and dependency reviews | `audit/LEGACY_*`, `audit/*DEPENDENCY*`, `audit/*MIGRATION*` | `audit/historical/` | Current path active |

## Required Preservation Metadata

- Original filename.
- Original audit result and finding text.
- Original location or compatibility path.
- Associated project, capability, or release.
- Migration manifest entry, if future movement occurs.

## Excluded From MU-004

| Area | Reason |
| --- | --- |
| Audit file movement | Requires separate taxonomy migration approval |
| Audit report content edits | Audit evidence preservation boundary |
| Release package files | MU-003 and release governance scope |
| Governance files | MU-002 scope |
| Platform project folders | MU-005 scope |
| Runtime files | Runtime migration excluded |
