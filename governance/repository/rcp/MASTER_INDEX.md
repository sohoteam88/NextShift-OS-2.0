# Repository Cleanup Program Master Index

Program: Repository Cleanup Program v1.0
Phase: RCP-001 Cleanup Pilot
Status: Released

## Purpose

This index registers Repository Cleanup Program documents and future cleanup waves.

## RCP-000 Documents

| Document | Purpose |
| --- | --- |
| [Program Charter](PROGRAM_CHARTER.md) | Defines mission, scope, principles, and success criteria |
| [Program Roadmap](PROGRAM_ROADMAP.md) | Defines RCP sequence and lifecycle path |
| [Program Governance](PROGRAM_GOVERNANCE.md) | Defines cleanup governance principles and gates |
| [Status](STATUS.md) | Tracks current phase, cleanup state, and program health |
| [Master Index](MASTER_INDEX.md) | Registers program documents and future waves |

## RCP-000 Release Package

| Document | Purpose |
| --- | --- |
| [Approval Record](releases/RCP_v1.0_INIT/APPROVAL_RECORD.md) | Records RCP-000 approval for release subject to repository commit |
| [Release Checklist](releases/RCP_v1.0_INIT/RELEASE_CHECKLIST.md) | Tracks RCP-000 release validation and publication steps |
| [Release Notes](releases/RCP_v1.0_INIT/RELEASE_NOTES.md) | Summarizes RCP-000 release result and next phase |

## RCP-001 Stop A Planning Package

| Document | Purpose |
| --- | --- |
| [Planning](RCP-001-cleanup-pilot/PLANNING.md) | Defines the RCP-001 pilot candidate and planning entry |
| [Cleanup Contract](RCP-001-cleanup-pilot/CLEANUP_CONTRACT.md) | Defines RCP-001 cleanup contract ownership and next step |
| [Execution Task](RCP-001-cleanup-pilot/EXECUTION_TASK.md) | Defines the RCP-001 execution task boundary for Stop B |

## RCP-001 Stop B Implementation Package

| Document | Purpose |
| --- | --- |
| [Implementation Plan](RCP-001-cleanup-pilot/IMPLEMENTATION_PLAN.md) | Defines the RCP-001 archive implementation scope |
| [Implementation Task](RCP-001-cleanup-pilot/IMPLEMENTATION_TASK.md) | Defines Stop B execution and validation tasks |
| [Repository Audit Contract](RCP-001-cleanup-pilot/REPOSITORY_AUDIT_CONTRACT.md) | Defines audit scope for reference integrity and rollback readiness |
| [Archive Manifest](../../../archive/audit/templates/ARCHIVE_MANIFEST.md) | Records archive action, compatibility handling, and restore plan |

## RCP-001 Stop C Release Package

| Document | Purpose |
| --- | --- |
| [Approval Record](releases/RCP_001_CLEANUP_PILOT/APPROVAL_RECORD.md) | Records RCP-001 release approval |
| [Cleanup Completion Report](releases/RCP_001_CLEANUP_PILOT/CLEANUP_COMPLETION_REPORT.md) | Summarizes cleanup pilot implementation outcome |
| [Release Checklist](releases/RCP_001_CLEANUP_PILOT/RELEASE_CHECKLIST.md) | Tracks RCP-001 release validation and publication steps |
| [Release Notes](releases/RCP_001_CLEANUP_PILOT/RELEASE_NOTES.md) | Summarizes RCP-001 release result and next phase |

## Future Cleanup Waves

| Wave | Name | Status |
| --- | --- | --- |
| RCP-001 | Cleanup Pilot | Released |
| RCP-002 | Cleanup Wave 1 | Not started |
| RCP-003 | Cleanup Wave 2 | Not started |
| RCP-004 | Cleanup Wave 3 | Not started |
| RCP-005 | Repository v4 Release | Not started |

## Governing References

The following repository governance artifacts must be loaded before RCP execution:

- `governance/repository/REPOSITORY_ARCHITECTURE_FREEZE.md`
- `governance/repository/REPOSITORY_RETENTION_POLICY.md`
- `governance/repository/CLEANUP_CLASSIFICATION_STANDARD.md`
- `governance/repository/RMP_EXECUTION_FRAMEWORK.md`
- `governance/repository/LEGACY_REPOSITORY_INVENTORY.md`
- `governance/repository/LEGACY_CLASSIFICATION_MATRIX.md`
- `governance/repository/CLEANUP_CANDIDATE_REGISTER.md`
- `governance/repository/ARCHIVE_CANDIDATE_REGISTER.md`
- `governance/repository/CLEANUP_PILOT_PLAN.md`
- `governance/repository/CLEANUP_EXECUTION_CHECKLIST.md`
- `governance/repository/CLEANUP_ROLLBACK_PLAN.md`
- `governance/repository/PILOT_SUCCESS_CRITERIA.md`

## RCP-001 Entry

RCP-001 starts only after RCP-000 approval and must use the approved pilot candidate:

```text
audit/beta-user-interview-template.md
```

The approved archive copy is:

```text
archive/audit/templates/beta-user-interview-template.md
```

## Lifecycle Registration

All cleanup candidates must follow:

```text
Active -> Deprecated -> Archived -> Frozen -> Removed
```

No candidate may skip directly to `Removed`.

## Non-Authorization

This index does not authorize cleanup, archive movement, deletion, migration, or runtime changes.
