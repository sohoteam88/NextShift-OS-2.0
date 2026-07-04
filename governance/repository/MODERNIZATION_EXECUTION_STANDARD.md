# Modernization Execution Standard

Project: Repository Modernization Program v1.0
Package: RMP-001A Execution Framework Planning
Status: Planning baseline

## Purpose

This standard defines the minimum execution rules for every Repository Modernization Program wave.

## Wave Gate Model

Each wave must pass these gates:

| Gate | Requirement |
| --- | --- |
| Gate 1 Intake | Approved planning package exists |
| Gate 2 Dependency | Prior wave evidence is present |
| Gate 3 Scope | Scope matches RMP and RAF boundaries |
| Gate 4 Compatibility | Old-path discoverability is planned |
| Gate 5 Rollback | Rollback checklist is complete |
| Gate 6 Validation | Required checks pass before execution |
| Gate 7 Evidence | Implementation evidence is captured after execution |
| Gate 8 Audit | Verification or audit artifact is available |

## Execution Order

RMP waves must execute in this order:

```text
RMP-001 Platform Structure Migration
RMP-002 Governance Migration Execution
RMP-003 Release Structure Migration
RMP-004 Audit Taxonomy Migration
RMP-005 Repository Cleanup
RMP-006 Repository v4 Release
```

No wave may skip ahead unless a later approved governance decision explicitly changes the order.

## File Action Rules

Allowed file actions must be declared before execution:

- Create.
- Modify.
- Move.
- Archive.
- Compatibility stub creation.
- Index or registry update.

Deletion is not an allowed RMP execution action unless a separate deletion approval package is created after archive and cleanup classification.

## Protected Artifact Rules

The following require preserve-first handling:

- Release packages.
- Release manifests.
- Release notes.
- Approval records.
- Audit reports.
- Requirements verification.
- Governance standards.
- Migration manifests.
- Compatibility maps.
- Runtime source files.
- Database migrations.
- Deployment configuration.

## Validation Rules

Pre-execution and post-execution validation must include:

```text
git status --short
git diff --check
git diff --cached --check
```

Documentation waves must additionally validate changed markdown links.

## Handoff Rules

Every wave handoff must state:

- Completed gate status.
- Remaining blocked items.
- Compatibility status.
- Archive status.
- Rollback status.
- Next required lifecycle artifact.

## Failure Handling

If a wave fails validation:

1. Stop immediately.
2. Do not commit.
3. Do not tag.
4. Do not push.
5. Report exact failures.
6. Preserve current state unless rollback is explicitly authorized.
