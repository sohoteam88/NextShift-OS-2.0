# Rollback Execution Standard

Project: Repository Modernization Program v1.0
Package: RMP-001A Execution Framework Planning
Status: Planning baseline

## Purpose

This standard defines rollback planning and execution requirements for every RMP wave.

## Rollback Principle

Every approved migration, compatibility, archive, or registry action must have a documented way to restore the pre-execution state.

## Rollback Planning Requirements

Before execution, every wave must define:

- Files to be created.
- Files to be modified.
- Files to be moved.
- Files to be archived.
- Registries to be updated.
- Compatibility stubs to be created.
- Reverse action for each change.
- Validation after rollback.

## Rollback Checklist

Every rollback checklist must include:

- Trigger condition.
- Current commit or working tree reference.
- Files requiring reversal.
- Commands or manual steps.
- Expected post-rollback path state.
- Validation commands.
- Residual risk.

## Rollback Triggers

Rollback may be required when:

- Required validation fails.
- Compatibility breaks.
- Protected artifact state changes unexpectedly.
- Runtime files are modified out of scope.
- Release or audit evidence becomes undiscoverable.
- Scope drift is detected after execution.

## Rollback Validation

After rollback, run:

```text
git status --short
git diff --check
git diff --cached --check
```

Also validate markdown links if documentation paths changed before rollback.

## Rollback Evidence

Rollback evidence must report:

- Trigger.
- Actions reversed.
- Files restored.
- Files still changed.
- Validation results.
- Whether the wave can resume.

## Commit Safety

If a wave has not been committed:

- Prefer manual reversal or scoped restore of only wave-owned files.
- Do not reset unrelated user changes.
- Do not run destructive commands without explicit approval.

If a wave has been committed:

- Follow the approved project rollback plan.
- Do not rewrite history unless explicitly authorized.
- Preserve audit evidence of rollback.

## Stop Conditions

Stop and request direction if:

- Rollback would affect unrelated user changes.
- Rollback target cannot be identified.
- A protected artifact cannot be restored.
- Validation still fails after rollback.
