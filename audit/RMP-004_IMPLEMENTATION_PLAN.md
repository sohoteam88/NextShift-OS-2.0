# RMP-004 Implementation Plan

Project: Repository Modernization Program v1.0
Wave: RMP-004 Audit Taxonomy Migration
Status: Implementation package for review
Execution Mode: Package-only, no audit evidence movement

## Purpose

This plan defines the Audit Taxonomy Migration implementation package for Chief Repository Architect review.

## Authority

This package follows:

- [Audit Index](index.md)
- [Audit Registry Manifest](AUDIT_REGISTRY_MANIFEST.md)
- [Audit Compatibility Map](AUDIT_COMPATIBILITY_MAP.md)
- [Repository Architecture Freeze](../governance/repository/REPOSITORY_ARCHITECTURE_FREEZE.md)
- [Migration Freeze Matrix](../governance/repository/MIGRATION_FREEZE_MATRIX.md)
- [RMP Execution Framework](../governance/repository/RMP_EXECUTION_FRAMEWORK.md)
- [Modernization Execution Standard](../governance/repository/MODERNIZATION_EXECUTION_STANDARD.md)

## Scope

Included:

- Audit taxonomy migration planning.
- Audit registry evolution planning.
- Compatibility mapping.
- Validation planning.
- Rollback planning.

Excluded:

- Runtime migration.
- Governance migration.
- Release package movement.
- Cleanup.
- Deployment.
- Commit or push.

## Current Audit Structure

| Area | Current Path | Current Handling |
| --- | --- | --- |
| Audit registry | [audit/index.md](index.md) | Retain as audit discovery entry point |
| Audit registry manifest | [AUDIT_REGISTRY_MANIFEST.md](AUDIT_REGISTRY_MANIFEST.md) | Retain as RepoOS MU-004 review manifest |
| Audit compatibility map | [AUDIT_COMPATIBILITY_MAP.md](AUDIT_COMPATIBILITY_MAP.md) | Retain as RepoOS MU-004 compatibility map |
| Repository audit reports | `audit/RAR-*`, `audit/RAF-*`, `audit/RMP-*` | Preserve current evidence paths |
| Business OS audit reports | `audit/BOS_*` | Preserve current evidence paths |
| Capability audit reports | `audit/CAP_*` | Preserve current evidence paths |
| Platform audit reports | `audit/DS_*`, `audit/UK_*`, `audit/WEF_*` | Preserve current evidence paths |
| Historical audits | `audit/LEGACY_*`, dependency, migration, and authority reviews | Preserve current evidence paths |

## Proposed Audit Taxonomy

RMP-004 prepares the audit taxonomy model without moving existing audit evidence in this Stop A package.

```text
audit/
  index.md
  RMP-004_IMPLEMENTATION_PLAN.md
  AUDIT_TAXONOMY_MIGRATION_MANIFEST.md
  AUDIT_TAXONOMY_COMPATIBILITY_MAP.md
  AUDIT_TAXONOMY_VALIDATION_CHECKLIST.md
  AUDIT_TAXONOMY_ROLLBACK_CHECKLIST.md
```

Future approved execution may introduce or populate these audit taxonomy domains:

```text
audit/repository/
audit/releases/
audit/capabilities/
audit/business-os/
audit/platform/
audit/historical/
```

## File Actions

| Action | Path | Status |
| --- | --- | --- |
| Create | `audit/RMP-004_IMPLEMENTATION_PLAN.md` | In package |
| Create | `audit/AUDIT_TAXONOMY_MIGRATION_MANIFEST.md` | In package |
| Create | `audit/AUDIT_TAXONOMY_COMPATIBILITY_MAP.md` | In package |
| Create | `audit/AUDIT_TAXONOMY_VALIDATION_CHECKLIST.md` | In package |
| Create | `audit/AUDIT_TAXONOMY_ROLLBACK_CHECKLIST.md` | In package |
| Move | Audit evidence files | Not authorized by this package |
| Rewrite | Audit findings or results | Not authorized |
| Delete | Any audit evidence | Not authorized |

## Registry Evolution Plan

Future registry updates must:

- Preserve [audit/index.md](index.md) as the audit evidence discovery entry point.
- Add links to approved RMP-004 package artifacts only after review.
- Preserve current audit file paths until taxonomy movement executes.
- Keep release package discovery delegated to [releases/index.md](../releases/index.md).
- Keep governance discovery delegated to [governance/index.md](../governance/index.md).
- Keep platform discovery delegated to [platform/index.md](../platform/index.md).

## Compatibility Plan

Compatibility is defined in [Audit Taxonomy Compatibility Map](AUDIT_TAXONOMY_COMPATIBILITY_MAP.md).

The central rule is:

```text
current audit evidence paths remain active until future taxonomy paths exist, registries link to them, and compatibility stubs are approved.
```

## Validation Plan

Validation is defined in [Audit Taxonomy Validation Checklist](AUDIT_TAXONOMY_VALIDATION_CHECKLIST.md).

Required commands:

```text
git status --short
git diff --check
git diff --cached --check
```

Local markdown link validation is required for all RMP-004 package files.

## Rollback Plan

Rollback is defined in [Audit Taxonomy Rollback Checklist](AUDIT_TAXONOMY_ROLLBACK_CHECKLIST.md).

Because this Stop A package creates documentation-only implementation package files and performs no audit evidence movement, rollback is limited to removing the five RMP-004 package files if explicitly authorized.

## Stop Conditions

Stop immediately if:

- Runtime migration appears in scope.
- Governance migration appears in scope.
- Release package movement appears in scope.
- Cleanup appears in scope.
- Audit evidence would be rewritten.
- Audit evidence would be deleted.
- Compatibility cannot be proven.
- Validation fails.

## Review Handoff

This package is ready for Chief Repository Architect review when:

- All five package files exist.
- Local markdown links validate.
- `git diff --check` passes.
- `git diff --cached --check` passes.
- No commit or push has occurred.
