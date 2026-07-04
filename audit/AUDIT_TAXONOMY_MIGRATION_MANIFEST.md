# Audit Taxonomy Migration Manifest

Project: Repository Modernization Program v1.0
Wave: RMP-004 Audit Taxonomy Migration
Status: Implementation package for review

## Purpose

This manifest defines the Audit Taxonomy Migration package inventory and future audit taxonomy boundaries.

## Manifest Scope

This Stop A manifest records package creation and audit taxonomy migration planning only. It does not authorize audit evidence movement, audit finding rewrites, release package movement, governance migration, runtime migration, cleanup, deployment, commit, or push.

## Package Files

| File | Purpose | Action |
| --- | --- | --- |
| [RMP-004 Implementation Plan](RMP-004_IMPLEMENTATION_PLAN.md) | Defines wave scope and execution plan | Create |
| [Audit Taxonomy Migration Manifest](AUDIT_TAXONOMY_MIGRATION_MANIFEST.md) | Defines package inventory and taxonomy boundaries | Create |
| [Audit Taxonomy Compatibility Map](AUDIT_TAXONOMY_COMPATIBILITY_MAP.md) | Maps current audit evidence paths to future handling | Create |
| [Audit Taxonomy Validation Checklist](AUDIT_TAXONOMY_VALIDATION_CHECKLIST.md) | Defines required validation gates | Create |
| [Audit Taxonomy Rollback Checklist](AUDIT_TAXONOMY_ROLLBACK_CHECKLIST.md) | Defines rollback readiness | Create |

## Current Evidence Inventory

| Evidence Family | Current Path Pattern | Future Taxonomy Target | RMP-004 Action |
| --- | --- | --- | --- |
| Repository Architecture Reset audits | `audit/RAR-*_REPOSITORY_AUDIT_REPORT.md` | `audit/repository/rar/` | Map only |
| Repository Architecture Freeze audits | `audit/RAF-*_REPOSITORY_ARCHITECTURE_FREEZE_*AUDIT_REPORT.md` | `audit/repository/freeze/` | Map only |
| Repository Modernization Program audits | `audit/RMP-*_REPOSITORY_MIGRATION_*AUDIT_REPORT.md` | `audit/repository/rmp/` | Map only |
| Architecture freeze and package audits | `audit/ARCHITECTURE_*`, `audit/PACKAGE_*` | `audit/repository/` | Map only |
| Business OS audits | `audit/BOS_*_AUDIT_REPORT.md` | `audit/business-os/` | Map only |
| Business OS release audit | [BUSINESS_OS_v1.0_RELEASE_PACKAGE_AUDIT_REPORT.md](BUSINESS_OS_v1.0_RELEASE_PACKAGE_AUDIT_REPORT.md) | `audit/releases/business-os/v1.0/` | Map only |
| Capability audits | `audit/CAP_*_AUDIT_REPORT.md` | `audit/capabilities/` | Map only |
| Design System audits | `audit/DS_*_AUDIT_REPORT.md`, `audit/NEXTSHIFT_DESIGN_SYSTEM_*` | `audit/platform/design-system/` | Map only |
| UI Kit audits | `audit/UK_*_AUDIT_REPORT.md`, `audit/UIKIT_*`, `audit/UI_*` | `audit/platform/ui-kit/` | Map only |
| Workspace Experience audits | `audit/WEF_*_AUDIT_REPORT.md` | `audit/platform/workspace-experience/` | Map only |
| Architecture milestone audits | `docs/audit/ARC_*` | `audit/platform/architecture/` | Map only |
| Legacy and dependency reviews | `audit/LEGACY_*`, `audit/*DEPENDENCY*`, `audit/*MIGRATION*` | `audit/historical/` | Map only |
| Project-local audit reports | `docs/nextshift-os-3/**/AUDIT_REPORT.md` | Domain-specific audit taxonomy | Classify before movement |

## Future Target Inventory

Future targets are planning targets only until a later approved execution package authorizes movement.

| Future Target | Intended Purpose | Current Status |
| --- | --- | --- |
| `audit/repository/` | Repository architecture, freeze, modernization, package, and hygiene audits | Not populated by this package |
| `audit/releases/` | Release package audits | Not populated by this package |
| `audit/capabilities/` | Capability audit reports | Not populated by this package |
| `audit/business-os/` | Business OS capability and project audit reports | Not populated by this package |
| `audit/platform/` | UI Kit, WEF, Design System, and platform-family audit reports | Not populated by this package |
| `audit/historical/` | Legacy, dependency, migration, and authority reviews | Not populated by this package |

## Excluded From RMP-004

| Path Family | Reason |
| --- | --- |
| `releases/` | Release package movement excluded |
| `governance/` | Governance migration excluded |
| `platform/` | Platform structure migration handled by RMP-002 |
| `docs/nextshift-os-3/engineering/releases/` | Release package movement excluded |
| `src/` | Runtime migration excluded |
| `packages/` | Runtime package migration excluded |

## Manifest Decision

RMP-004 prepares audit taxonomy migration review materials. The package does not move, rewrite, reinterpret, archive, or delete audit evidence.
