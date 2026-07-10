# Repository Cleanup Program Roadmap

Program: Repository Cleanup Program v1.0
Phase: RCP-000 Program Initialization
Status: Planning

## Purpose

This roadmap defines the governed sequence from Engineering OS v1.0 through Repository v4 release and long-term repository lifecycle management.

## Roadmap Sequence

```text
Engineering OS v1.0
  -> RCP-000 Program Initialization
  -> RCP-001 Cleanup Pilot
  -> RCP-002 Cleanup Wave 1
  -> RCP-003 Cleanup Wave 2
  -> RCP-004 Cleanup Wave 3
  -> RCP-005 Repository v4 Release
  -> Repository Lifecycle
```

## Wave Definitions

| Wave | Name | Purpose | Execution Boundary |
| --- | --- | --- | --- |
| RCP-000 | Program Initialization | Establish cleanup program governance | Planning only |
| RCP-001 | Cleanup Pilot | Validate cleanup workflow with one low-risk candidate | Requires explicit implementation approval |
| RCP-002 | Cleanup Wave 1 | Execute first approved cleanup set | Requires pilot approval and wave package |
| RCP-003 | Cleanup Wave 2 | Execute second approved cleanup set | Requires Wave 1 evidence |
| RCP-004 | Cleanup Wave 3 | Execute final approved cleanup set | Requires Wave 2 evidence |
| RCP-005 | Repository v4 Release | Package repository cleanup completion | Release governance only |

## Repository Lifecycle States

```text
Active -> Deprecated -> Archived -> Frozen -> Removed
```

| State | Meaning |
| --- | --- |
| Active | Current authoritative asset |
| Deprecated | Replaced or superseded, but still discoverable |
| Archived | Preserved in approved archive path |
| Frozen | Retained for historical or evidence reasons |
| Removed | Deleted only after explicit approval and restore plan |

## Roadmap Gates

Each wave requires:

- Approved scope.
- Candidate inventory.
- Classification evidence.
- Reference scan.
- Compatibility plan.
- Archive plan, if archive is proposed.
- Rollback plan.
- Validation results.
- Audit-ready evidence.

## Stop Conditions

Stop the roadmap if:

- Protected evidence is in cleanup scope.
- Release evidence would change.
- Audit evidence would be rewritten.
- Runtime files are included.
- Rollback is missing.
- Validation fails.

## RCP-001 Entry Criteria

RCP-001 may begin only when:

- RCP-000 is approved.
- Cleanup pilot candidate is confirmed.
- Owner approval path is defined.
- Reference scan method is ready.
- Archive target is documented.
- Rollback plan is available.

## Non-Authorization

This roadmap does not authorize cleanup, archive movement, deletion, migration, runtime changes, commit, or push.
