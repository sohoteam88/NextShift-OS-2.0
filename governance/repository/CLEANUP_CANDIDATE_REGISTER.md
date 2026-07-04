# Cleanup Candidate Register

Project: Repository Modernization Program v1.0
Wave: RMP-005 Legacy Repository Classification
Status: Classification baseline

## Purpose

This register identifies cleanup planning candidates. It does not authorize cleanup, archive movement, deletion, or migration.

## Cleanup Candidate Rule

A cleanup candidate is not a deletion candidate. It is a file or family that needs reference validation, owner review, taxonomy placement, archive planning, or compatibility handling before any cleanup action can be proposed.

## Candidate Register

| Candidate | Current Path or Pattern | Classification | Proposed Disposition | Required Before Action |
| --- | --- | --- | --- | --- |
| Audit-like doc outside audit taxonomy | `docs/system-page-legacy-residual-audit-2026-06-20.md` | Migrate | Map to audit taxonomy | Reference scan, audit taxonomy approval, compatibility plan |
| Documentation dependency graph | `docs/dependency-graph.md` | Review | Migrate or retain | Owner review, reference scan, target registry decision |
| Architecture migration plan | `docs/architecture/NS31_MIGRATION_PLAN.md` | Review | Retain or migrate | Architecture owner review, target taxonomy decision |
| Backup strategy document | `audit/backup-strategy.md` | Review | Retain or archive | Reference scan, owner decision, archive plan |
| Placeholder feature report | `audit/placeholder-feature-report.md` | Review | Retain or archive | Reference scan, evidence check, owner decision |
| Beta user interview template | `audit/beta-user-interview-template.md` | Review | Retain or archive | Owner decision, reference scan, archive path |
| Legacy bridge evidence | `audit/*BRIDGE*` | Retain | No cleanup action | Protected evidence |
| Legacy retirement evidence | `audit/*RETIREMENT*`, `audit/*DELETION_REPORT*` | Retain | No cleanup action | Protected evidence |
| Legacy migration evidence | `audit/*MIGRATION*`, `audit/*migration*` | Retain | No cleanup action | Protected evidence |
| Dependency audit evidence | `audit/*DEPENDENCY*`, `audit/*dependency*` | Retain | No cleanup action | Protected evidence |

## Delete Candidate Register

No delete candidates are approved.

| Candidate | Status | Reason |
| --- | --- | --- |
| None | Not approved | Deletion requires a separate approval package |

## Required Cleanup Package Evidence

Any future cleanup execution package must include:

- Candidate path.
- Classification.
- Reason.
- Reference scan result.
- Release evidence check.
- Audit evidence check.
- Governance dependency check.
- Runtime exclusion check.
- Proposed disposition.
- Validation plan.
- Rollback plan.

## Stop Conditions

Stop cleanup planning if:

- Candidate is release evidence.
- Candidate is audit evidence.
- Candidate is active governance.
- Candidate is runtime source.
- Candidate is database migration.
- Candidate is deployment configuration.
- Candidate has unresolved references.
- Rollback is not defined.

## Non-Authorization

This register does not authorize cleanup, deletion, archive execution, migration, commit, or push.
