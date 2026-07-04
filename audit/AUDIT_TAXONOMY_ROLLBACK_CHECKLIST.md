# Audit Taxonomy Rollback Checklist

Project: Repository Modernization Program v1.0
Wave: RMP-004 Audit Taxonomy Migration
Status: Implementation package for review

## Purpose

This checklist defines rollback readiness for the RMP-004 Audit Taxonomy Migration implementation package.

## Rollback Scope

This Stop A package creates documentation-only implementation package files. It does not move, delete, archive, or rewrite existing audit evidence, governance, release, runtime, platform, or cleanup files.

## Package Files Subject To Rollback

| File | Rollback Action |
| --- | --- |
| `audit/RMP-004_IMPLEMENTATION_PLAN.md` | Remove only if explicitly authorized |
| `audit/AUDIT_TAXONOMY_MIGRATION_MANIFEST.md` | Remove only if explicitly authorized |
| `audit/AUDIT_TAXONOMY_COMPATIBILITY_MAP.md` | Remove only if explicitly authorized |
| `audit/AUDIT_TAXONOMY_VALIDATION_CHECKLIST.md` | Remove only if explicitly authorized |
| `audit/AUDIT_TAXONOMY_ROLLBACK_CHECKLIST.md` | Remove only if explicitly authorized |

## Files Not Subject To Rollback

RMP-004 rollback must not alter:

- [Audit Index](index.md)
- [Audit Registry Manifest](AUDIT_REGISTRY_MANIFEST.md)
- [Audit Compatibility Map](AUDIT_COMPATIBILITY_MAP.md)
- [Audit Validation Checklist](AUDIT_VALIDATION_CHECKLIST.md)
- [Audit Rollback Checklist](AUDIT_ROLLBACK_CHECKLIST.md)
- [Platform Index](../platform/index.md)
- [Governance Index](../governance/index.md)
- [Release Index](../releases/index.md)
- Current audit evidence files.
- Runtime source files.
- Release packages.
- Governance files.

## Rollback Triggers

Rollback may be considered if:

- Required validation fails.
- Package scope is rejected.
- Compatibility mapping is rejected.
- Audit evidence preservation cannot be proven.
- A protected artifact is found to be in scope.
- Runtime migration is detected.

## Rollback Procedure

Because no existing files are modified by this package, rollback is limited to removal of the five package files after explicit approval.

Required rollback validation:

```text
git status --short
git diff --check
git diff --cached --check
```

Markdown link validation is required if registry links are added before rollback in a later task.

## Rollback Evidence

Rollback evidence must include:

- Trigger reason.
- Files removed.
- Files intentionally preserved.
- Validation results.
- Residual risk.

## Rollback Safety Rule

Do not run destructive commands, reset unrelated changes, rewrite audit evidence, or remove pre-existing repository artifacts without explicit operator approval.
