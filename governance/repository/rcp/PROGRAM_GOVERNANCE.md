# Repository Cleanup Program Governance

Program: Repository Cleanup Program v1.0
Phase: RCP-000 Program Initialization
Status: Planning

## Purpose

This document defines governance rules for all Repository Cleanup Program waves.

## Governance Principles

| Principle | Requirement |
| --- | --- |
| Safety First | Stop before changing protected evidence or runtime files |
| Archive Before Delete | Archive or restore path must exist before deletion is considered |
| Compatibility First | Old paths remain discoverable until retirement is approved |
| Rollback Required | Every action must have a documented rollback path |
| Evidence Preservation | Release and audit evidence must remain intact |
| Governance Protected | Standards, charters, and lifecycle records cannot be removed by cleanup |

## Protected Assets

The following are protected from cleanup deletion:

- Release packages.
- Release manifests.
- Release notes.
- Approval and authorization records.
- Audit reports.
- Requirements verification artifacts.
- Migration manifests.
- Compatibility maps.
- Governance standards.
- Runtime source files.
- Database migrations.
- Deployment configuration.

## Cleanup Governance Gates

Every cleanup wave must pass:

1. Classification gate.
2. Reference scan gate.
3. Protected evidence gate.
4. Compatibility gate.
5. Archive gate.
6. Rollback gate.
7. Validation gate.
8. Audit evidence gate.

## Required Validation

Every implementation wave must run:

```text
git status --short
git diff --check
git diff --cached --check
```

Markdown link validation is required when markdown links, registries, manifests, or indexes change.

## Deletion Governance

Deletion is not permitted by RCP-000.

Future deletion requires:

- Prior archive or restore plan.
- Proof of non-protected status.
- Proof of no active references.
- Explicit operator approval.
- Rollback evidence.
- Validation evidence.

## Runtime Boundary

Runtime files are excluded from RCP cleanup unless a later runtime-specific lifecycle explicitly authorizes action.

## Non-Authorization

This governance document does not authorize cleanup, archive movement, deletion, migration, runtime changes, commit, or push.
