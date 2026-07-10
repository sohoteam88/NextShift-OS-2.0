# Legacy Classification Matrix

Project: Repository Modernization Program v1.0
Wave: RMP-005 Legacy Repository Classification
Status: Classification baseline

## Purpose

This matrix assigns cleanup classifications to legacy repository asset families before cleanup planning begins.

## Classification Rules

Every legacy asset must resolve to one primary classification:

- Retain.
- Migrate.
- Archive.
- Compatibility.
- Review.
- Delete Candidate.
- Excluded.

No classification in this matrix authorizes file deletion or archive execution.

## Matrix

| Asset Family | Path Pattern | Classification | Reason | Future Disposition |
| --- | --- | --- | --- | --- |
| Release packages | `releases/**`, `docs/**/releases/**` | Retain | Release evidence is retained indefinitely | Preserve and index |
| Audit reports | `audit/*AUDIT*`, `audit/*REVIEW*`, `audit/*REPORT*` | Retain | Audit evidence is protected | Preserve and map through audit taxonomy |
| Legacy audit evidence | `audit/LEGACY_*`, `audit/legacy-*` | Retain | Historical evidence | Preserve and map to `audit/historical/` only if approved |
| Migration evidence | `audit/*MIGRATION*`, `audit/*migration*` | Retain | Migration and audit history | Preserve and map to `audit/historical/` |
| Dependency evidence | `audit/*DEPENDENCY*`, `audit/*dependency*`, `audit/*dependency-map*` | Retain | Architecture and dependency history | Preserve and map to `audit/historical/` |
| Bridge evidence | `audit/*BRIDGE*` | Retain | Legacy transition history | Preserve and map to `audit/historical/` |
| Retirement evidence | `audit/*RETIREMENT*`, `audit/*DELETION_REPORT*` | Retain | Cleanup and deletion history evidence | Preserve indefinitely |
| Current RMP audit reports | `audit/RMP-*` | Retain | Active repository modernization evidence | Preserve |
| Current RMP implementation packages | `platform/PLATFORM_STRUCTURE_*`, `governance/GOVERNANCE_STRUCTURE_*`, `audit/AUDIT_TAXONOMY_*` | Retain | Active modernization lifecycle artifacts | Preserve until release handoff |
| Repository governance framework | `governance/repository/**` | Retain | Active governance and execution framework | Preserve |
| Business OS dependency models | `docs/nextshift-os-3/business-os/phase-1/**/DEPENDENCY_MODEL.md` | Retain | Released project documentation | Preserve with Business OS release history |
| Audit-like docs outside audit | `docs/system-page-legacy-residual-audit-2026-06-20.md` | Migrate | Audit-like evidence outside audit taxonomy | Map to audit taxonomy before movement |
| Documentation dependency graph | `docs/dependency-graph.md` | Review | Dependency evidence outside audit taxonomy | Owner review before migration or archive |
| Architecture migration plan | `docs/architecture/NS31_MIGRATION_PLAN.md` | Review | Architecture planning history | Owner review before migration |
| Backup strategy document | `audit/backup-strategy.md` | Review | Operational or audit-context document, not automatically cleanup-safe | Reference scan required |
| Placeholder feature report | `audit/placeholder-feature-report.md` | Review | Name suggests potential placeholder but path may be evidence | Reference scan required |
| Beta user interview template | `audit/beta-user-interview-template.md` | Review | Template-like artifact in audit folder | Owner review required |
| Runtime source | `src/**`, `packages/**` | Excluded | Runtime migration excluded from RMP cleanup classification | Out of cleanup scope |
| Database migrations | `prisma/migrations/**`, `supabase/migrations/**` | Excluded | Protected runtime and data history | Out of cleanup scope |
| Deployment configuration | `deploy/**`, `.github/**` | Excluded | Deployment and CI history protected | Out of cleanup scope |

## Cleanup Eligibility Decision

No file is cleanup-eligible until:

- It is not protected.
- It is not linked by a registry.
- It is not referenced by release or audit evidence.
- It is not required by current lifecycle state.
- A replacement or archive path exists.
- Rollback is possible.
- Operator approval exists.

## Delete Candidate Decision

No delete candidates are approved by RMP-005 Stop A.

Potential deletion requires a future deletion approval package after archive and reference validation.
