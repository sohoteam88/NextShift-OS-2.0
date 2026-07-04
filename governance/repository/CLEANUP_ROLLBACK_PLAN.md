# Cleanup Rollback Plan

Project: Repository Modernization Program v1.0
Wave: RMP-006 Cleanup Pilot Planning
Status: Planning baseline

## Purpose

This rollback plan defines how a future cleanup pilot action would be reversed if approved and executed.

## Candidate

| Field | Value |
| --- | --- |
| Source path | `audit/beta-user-interview-template.md` |
| Proposed archive path | `archive/audit/templates/beta-user-interview-template.md` |
| Proposed action | Archive only after approval |
| Delete candidate | No |

## Rollback Principle

The pilot must be reversible. If the candidate is archived in a future approved implementation, rollback restores the file to its original path and reverts any related manifest or compatibility entries.

## Rollback Triggers

Rollback may be required if:

- Validation fails.
- A reference is discovered after archive.
- Owner approval is withdrawn.
- Candidate is later determined to be evidence.
- Archive path is incorrect.
- Compatibility behavior is incomplete.

## Future Rollback Steps

If archive execution occurs later, rollback must:

1. Restore `audit/beta-user-interview-template.md` from archive path.
2. Remove or reverse the archive manifest entry.
3. Restore any compatibility note or registry entry.
4. Re-run markdown link validation if links changed.
5. Re-run git validation.
6. Report rollback evidence.

## Required Rollback Validation

Run:

```text
git status --short
git diff --check
git diff --cached --check
```

Run markdown link validation if markdown links changed.

## Rollback Evidence

Rollback evidence must include:

- Trigger.
- Files restored.
- Manifest changes reversed.
- Compatibility changes reversed.
- Validation results.
- Residual risk.

## Safety Rules

- Do not delete the archive copy unless separately approved.
- Do not alter unrelated audit files.
- Do not reset unrelated user changes.
- Do not rewrite history.
- Do not commit or push unless separately authorized.

## Current State

No rollback action is required now because RMP-006 Stop A performs planning only and does not execute archive, cleanup, migration, or deletion.
