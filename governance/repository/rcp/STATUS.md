# Repository Cleanup Program Status

Program: Repository Cleanup Program v1.0
Phase: RCP-001 Cleanup Pilot
Status: Frozen

## Current Phase

| Field | Value |
| --- | --- |
| Current phase | RCP-001 Cleanup Pilot |
| Current lifecycle state | Frozen |
| Source baseline | Engineering OS v1.0 |
| Active cleanup | Complete |
| Repository version target | Repository v4 |
| Program health | Green |
| Current operations framework | Repository Operations Framework v1.0 |
| Current health framework | Repository Health Framework v1.0 |
| Current cleanup framework | Repository Cleanup Framework v1.1 |

## Completed Waves

| Wave | Status |
| --- | --- |
| Engineering OS v1.0 | Complete |
| RCP-000 Program Initialization | Released |
| RCP-001 Cleanup Pilot | Frozen |
| RCP-002 Cleanup Wave 1 | Ready for planning |
| RCP-003 Cleanup Wave 2 | Not started |
| RCP-004 Cleanup Wave 3 | Not started |
| RCP-005 Repository v4 Release | Not started |

## Active Cleanup

RCP-001 completed an archive-copy-only cleanup pilot.

No files are approved for:

- Deletion.
- Migration.
- Runtime change.

## Current Pilot Candidate

The planned RCP-001 candidate remains:

```text
audit/beta-user-interview-template.md
```

RCP-001 Stop B authorized an archive copy only. Deletion, migration, runtime change, and source removal remain unauthorized.

## Current Archive Copy

```text
archive/audit/templates/beta-user-interview-template.md
```

The original source path remains in place for compatibility:

```text
audit/beta-user-interview-template.md
```

## Repository Lifecycle

```text
Active -> Deprecated -> Archived -> Frozen -> Removed
```

No source asset has been removed, migrated, or deleted under RCP-001 Stop B.

## Retrospective

RCP-001 retrospective is integrated at:

```text
governance/repository/rcp/RCP-001-cleanup-pilot/RCP_001_PILOT_RETROSPECTIVE.md
```

The retrospective prepares RCP-002 planning and does not authorize cleanup, archive movement, deletion, migration, or runtime changes.

## Wave Closure

RCP-001 wave closure is integrated at:

```text
governance/repository/rcp/RCP-001-cleanup-pilot/RCP_001_WAVE_CLOSURE.md
```

RCP-001 is frozen. Future cleanup work continues in RCP-002.

## Cleanup Framework

Repository Operations Framework v1.0 is integrated at:

```text
governance/repository/REPOSITORY_OPERATIONS_FRAMEWORK_v1.0.md
```

Repository Health Framework v1.0 is integrated at:

```text
governance/repository/REPOSITORY_HEALTH_FRAMEWORK_v1.0.md
```

Repository Cleanup Framework v1.1 is integrated at:

```text
governance/repository/rcp/REPOSITORY_CLEANUP_FRAMEWORK_v1.1.md
```

Repository Cleanup Framework v1.1 operates as the cleanup capability under Repository Operations Framework v1.0.

RCP-002 through RCP-004 must follow this framework for cleanup strategy model selection, candidate checks, archive manifests, rollback evidence, wave metrics, lifecycle stops, and stop conditions.

## Working Tree Requirement

Repository Operations Framework v1.0 integration requires the repository working tree to remain clean after validation.

## Next Required Phase

After RCP-001 release:

```text
RCP-002 Cleanup Wave 1 Planning
```

RCP-002 must begin with planning authorization, not direct cleanup execution.
