# RMP Execution Framework

Project: Repository Modernization Program v1.0
Package: RMP-001A Execution Framework Planning
Status: Planning baseline
Execution Mode: Design-only

## Purpose

This framework defines the lifecycle every Repository Modernization Program wave must follow before any repository migration, archive, cleanup, or release action is executed.

## Authority

The framework is governed by:

- RepoOS v1.0 checkpoint.
- Repository Architecture Freeze v1.0.
- RMP-001 Repository Modernization Program Planning.
- Migration Freeze Matrix.
- Repository Retention Policy.
- Cleanup Classification Standard.

## Execution Lifecycle

Every RMP wave must use this lifecycle:

1. Intake approved planning package.
2. Confirm lifecycle state from repository artifacts.
3. Confirm wave dependencies are complete.
4. Build source and target inventory.
5. Define compatibility actions.
6. Define rollback actions.
7. Run preflight validation.
8. Execute only approved file actions.
9. Re-run validation.
10. Produce audit-ready evidence.
11. Stop for review, release, or next wave authorization.

## Required Wave Artifacts

Each wave must include:

- Planning document.
- Execution task.
- Source inventory.
- Target inventory.
- Migration manifest or archive manifest.
- Compatibility map.
- Validation checklist.
- Rollback checklist.
- Implementation evidence.
- Audit or verification report.

## Global Constraints

- Runtime migration is excluded.
- Release packages remain immutable.
- Audit evidence remains preserved.
- Cleanup cannot run before migration waves complete.
- Archive must precede any future deletion request.
- No deletion is allowed without separate approval.
- Existing paths remain discoverable until compatibility retirement is approved.

## Required Validation Commands

Every wave must run:

```text
git status --short
git diff --check
git diff --cached --check
```

Markdown changes must also pass local link validation when registries, indexes, or relative links are changed.

## Stop Conditions

Stop immediately if:

- Validation fails.
- Scope includes runtime migration.
- A release package would be rewritten.
- Audit evidence would be rewritten or deleted.
- A protected artifact is targeted for cleanup deletion.
- Compatibility cannot be proven.
- Rollback cannot be described.

## Evidence Standard

Every execution must return:

- Files added.
- Files changed.
- Files moved.
- Files archived.
- Files intentionally not touched.
- Validation results.
- Rollback readiness.
- Known residual risks.

## Non-Authorization

This framework does not authorize migration, cleanup, archive movement, deletion, runtime changes, commit, tag, push, deployment, or merge.
