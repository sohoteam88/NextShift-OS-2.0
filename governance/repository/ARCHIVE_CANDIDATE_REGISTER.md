# Archive Candidate Register

Project: Repository Modernization Program v1.0
Wave: RMP-005 Legacy Repository Classification
Status: Classification baseline

## Purpose

This register identifies potential archive candidates and archive-excluded evidence before any future archive package is created.

## Archive Rule

Archive before deletion is mandatory. Archive is preservation, not deletion.

No archive action is approved by this register.

## Archive-Excluded Protected Evidence

| Asset Family | Path Pattern | Archive Status | Reason |
| --- | --- | --- | --- |
| Release packages | `releases/**`, `docs/**/releases/**` | Excluded | Release evidence retained indefinitely |
| Audit reports | `audit/*AUDIT*`, `audit/*REPORT*`, `audit/*REVIEW*` | Excluded unless taxonomy movement approved | Audit evidence retained indefinitely |
| Legacy audit evidence | `audit/LEGACY_*`, `audit/legacy-*` | Excluded unless taxonomy movement approved | Historical audit evidence |
| Migration reports and specs | `audit/*MIGRATION*`, `audit/*migration*` | Excluded unless taxonomy movement approved | Migration history evidence |
| Dependency audits and maps | `audit/*DEPENDENCY*`, `audit/*dependency*` | Excluded unless taxonomy movement approved | Architecture and dependency evidence |
| Retirement and deletion reports | `audit/*RETIREMENT*`, `audit/*DELETION_REPORT*` | Excluded | Cleanup history evidence |
| Current RMP artifacts | `audit/RMP-*`, `platform/PLATFORM_STRUCTURE_*`, `governance/GOVERNANCE_STRUCTURE_*` | Excluded | Active lifecycle evidence |
| Runtime files | `src/**`, `packages/**` | Excluded | Runtime migration excluded |
| Database migrations | `prisma/migrations/**`, `supabase/migrations/**` | Excluded | Protected data history |
| Deployment configuration | `deploy/**`, `.github/**` | Excluded | Deployment and CI history |

## Potential Archive Candidates

These candidates require review before archive approval.

| Candidate | Current Path | Classification | Potential Archive Target | Required Before Archive |
| --- | --- | --- | --- | --- |
| Backup strategy document | `audit/backup-strategy.md` | Review | `archive/audit/support/backup-strategy.md` | Reference scan, owner decision, archive package |
| Placeholder feature report | `audit/placeholder-feature-report.md` | Review | `archive/audit/support/placeholder-feature-report.md` | Evidence check, reference scan, owner decision |
| Beta user interview template | `audit/beta-user-interview-template.md` | Review | `archive/audit/templates/beta-user-interview-template.md` | Owner decision, reference scan, archive package |
| Documentation dependency graph | `docs/dependency-graph.md` | Review | `archive/docs/dependency-graph.md` or audit taxonomy target | Owner decision, reference scan, target decision |
| Architecture migration plan | `docs/architecture/NS31_MIGRATION_PLAN.md` | Review | `archive/docs/architecture/NS31_MIGRATION_PLAN.md` or platform architecture target | Architecture owner review |

## Archive Preconditions

Archive execution may begin only when:

- Candidate is not protected evidence.
- Candidate is not required by active lifecycle state.
- Candidate has reference scan evidence.
- Candidate has a registry or archive manifest entry.
- Candidate has a restore plan.
- Candidate is approved in a future archive package.

## Restore Requirements

Every future archive package must define:

- Source path.
- Archive path.
- Restore path.
- Compatibility handling.
- Validation commands.
- Rollback owner.

## Non-Authorization

This register does not authorize archive execution, cleanup, deletion, migration, commit, or push.
