# Legacy Repository Inventory

Project: Repository Modernization Program v1.0
Wave: RMP-005 Legacy Repository Classification
Status: Classification baseline
Execution Mode: Design-only, no cleanup execution

## Purpose

This inventory identifies legacy, migration, dependency, bridge, retirement, and cleanup-adjacent repository assets before any cleanup, archive, deletion, or migration activity is considered.

## Authority

This inventory follows:

- Repository Architecture Freeze v1.0.
- Repository Retention Policy.
- Cleanup Classification Standard.
- Cleanup Execution Policy.
- Archive Policy Execution.
- RMP Execution Framework.

## Inventory Method

Repository scan date: 2026-07-04

The inventory used filename and folder-pattern discovery for:

- `legacy`
- `migration`
- `dependency`
- `retirement`
- `bridge`
- `archive`
- `backup`
- `placeholder`
- `tmp`
- `old`
- `copy`

This inventory classifies legacy asset families. It does not move, rewrite, archive, delete, or retire files.

## Repository Counts Observed

| Area | Count |
| --- | ---: |
| Current `audit/` files | 526 |
| Current `docs/` files | 892 |
| Audit files matching legacy, migration, dependency, retirement, or bridge patterns | 55 |
| Documentation files matching legacy, migration, or dependency patterns | 11 |

## Primary Legacy Evidence Families

| Family | Current Path Pattern | Primary Classification | Notes |
| --- | --- | --- | --- |
| Legacy audit evidence | `audit/LEGACY_*`, `audit/legacy-*` | Retain | Audit evidence is protected |
| Legacy bridge evidence | `audit/*BRIDGE*` | Retain | Audit and migration evidence |
| Legacy retirement records | `audit/*RETIREMENT*`, `audit/*DELETION_REPORT*` | Retain | Historical decision evidence |
| Migration specs and reviews | `audit/*MIGRATION*`, `audit/*migration*` | Retain | Audit evidence and migration history |
| Dependency audits and maps | `audit/*DEPENDENCY*`, `audit/dependency-graph.md`, `audit/runtime-dependency-map.md` | Retain | Protected as audit or architecture evidence |
| Readiness reviews | `audit/*readiness-review.md` | Retain | Audit evidence |
| Architecture milestone migration plans | `docs/architecture/NS31_MIGRATION_PLAN.md` | Review | Documentation source; classify before movement |
| System legacy residual audit | `docs/system-page-legacy-residual-audit-2026-06-20.md` | Migrate | Audit-like evidence outside `audit/` |
| Documentation dependency graph | `docs/dependency-graph.md` | Review | Dependency evidence outside `audit/` |
| Business OS dependency models | `docs/nextshift-os-3/business-os/phase-1/**/DEPENDENCY_MODEL.md` | Retain | Active released project documentation |
| Backup or placeholder files in audit | `audit/backup-strategy.md`, `audit/placeholder-feature-report.md` | Review | Requires reference scan before archive |
| Template-like audit files | `audit/beta-user-interview-template.md` | Review | Requires owner decision before archive |

## Legacy Audit File Inventory

The following legacy, migration, dependency, retirement, and bridge-pattern audit files were identified and classified as protected unless later review proves otherwise:

| Path | Classification | Disposition |
| --- | --- | --- |
| `audit/ADR-024_MIGRATION_AUTHORITY.md` | Retain | Governance and migration authority evidence |
| `audit/ADR_017_V7_MIGRATION_GOVERNANCE_REVIEW.md` | Retain | Audit evidence |
| `audit/ADVISOR_MIGRATION_SPEC.md` | Retain | Migration evidence |
| `audit/AUDIT_TAXONOMY_MIGRATION_MANIFEST.md` | Retain | Active RMP-004 artifact |
| `audit/BRIDGE_DECOUPLING_AUDIT.md` | Retain | Audit evidence |
| `audit/BRIDGE_USAGE_AUDIT.md` | Retain | Audit evidence |
| `audit/CONTENT_DEPENDENCY_AUDIT.md` | Retain | Audit evidence |
| `audit/CONTENT_ENGINE_DEPENDENCY_MAP.md` | Retain | Dependency evidence |
| `audit/CRM_DEPENDENCY_AUDIT.md` | Retain | Audit evidence |
| `audit/DASHBOARD_DEPENDENCY_AUDIT.md` | Retain | Audit evidence |
| `audit/DNA_HEALTH_MIGRATION_SPEC.md` | Retain | Migration evidence |
| `audit/LEGACY_BRIDGE_FINAL_AUDIT.md` | Retain | Audit evidence |
| `audit/LEGACY_RETIREMENT_AUDIT.md` | Retain | Audit evidence |
| `audit/LEGACY_SURFACE_RETIREMENT_PLAN.md` | Retain | Retirement evidence |
| `audit/LEGACY_USAGE_AUDIT.md` | Retain | Audit evidence |
| `audit/PHASE_8A_2D_BUSINESS_STATE_MIGRATION_PLAN_REVIEW.md` | Retain | Audit evidence |
| `audit/PHASE_8A_3D_JOURNEY_MIGRATION_PLAN_REVIEW.md` | Retain | Audit evidence |
| `audit/PHASE_8A_V7_AUTHORITY_MIGRATION_MASTER_PLAN_REVIEW.md` | Retain | Audit evidence |
| `audit/PHASE_8B_1_BUSINESS_MODE_MIGRATION_SPEC_REVIEW.md` | Retain | Audit evidence |
| `audit/PHASE_8B_1_FINAL_BUSINESS_MODE_MIGRATION_SPEC_REVIEW.md` | Retain | Audit evidence |
| `audit/PHASE_9A_MIGRATION_GOVERNANCE_RULES.md` | Retain | Governance evidence |
| `audit/PR15_LEGACY_BRIDGE_DELETION_REPORT.md` | Retain | Deletion history evidence |
| `audit/REGENERATION_MIGRATION_SPEC.md` | Retain | Migration evidence |
| `audit/RMP-002_REPOSITORY_MIGRATION_AUDIT_REPORT.md` | Retain | Active RMP audit evidence |
| `audit/RMP-003_REPOSITORY_MIGRATION_AUDIT_REPORT.md` | Retain | Active RMP audit evidence |
| `audit/RMP-003_REPOSITORY_MIGRATION_REAUDIT_REPORT.md` | Retain | Active RMP audit evidence |
| `audit/RMP-004_REPOSITORY_MIGRATION_AUDIT_REPORT.md` | Retain | Active RMP audit evidence |
| `audit/RMP-004_REPOSITORY_MIGRATION_FINAL_REAUDIT_REPORT.md` | Retain | Active RMP audit evidence |
| `audit/RMP-004_REPOSITORY_MIGRATION_REAUDIT_REPORT.md` | Retain | Active RMP audit evidence |
| `audit/SALES_DEPENDENCY_AUDIT.md` | Retain | Audit evidence |
| `audit/TEAM_DEPENDENCY_AUDIT.md` | Retain | Audit evidence |
| `audit/V6_1_PR10B_SALES_ENGINE_MIGRATION_REPORT.md` | Retain | Migration evidence |
| `audit/V6_1_PR11B_TEAM_ENGINE_MIGRATION_REPORT.md` | Retain | Migration evidence |
| `audit/V6_1_PR6_EVOLUTION_LEGACY_BRIDGE_REPORT.md` | Retain | Legacy migration evidence |
| `audit/V6_1_PR7_SIDEBAR_MIGRATION_REPORT.md` | Retain | Migration evidence |
| `audit/V6_1_PR8B_UNLOCKPREVIEW_MIGRATION_REPORT.md` | Retain | Migration evidence |
| `audit/V6_1_PR8C_ROADMAP_MIGRATION_REPORT.md` | Retain | Migration evidence |
| `audit/V6_1_PR8D_DASHBOARD_MISSION_MIGRATION_REPORT.md` | Retain | Migration evidence |
| `audit/V6_1_PR8E_DASHBOARD_MIGRATION_REPORT.md` | Retain | Migration evidence |
| `audit/V6_1_PR9B_CRM_ENGINE_MIGRATION_REPORT.md` | Retain | Migration evidence |
| `audit/V6_2_PR12E1_CONTENT_ENGINE_HOOK_MIGRATION.md` | Retain | Migration evidence |
| `audit/V6_3F_LEGACY_SURFACE_REDIRECT_REPORT.md` | Retain | Legacy migration evidence |
| `audit/V6_MIGRATION_CONTRACT_REVIEW.md` | Retain | Audit evidence |
| `audit/V7_GLOBAL_MIGRATION_BLUEPRINT.md` | Retain | Migration evidence |
| `audit/agent-runtime-migration-readiness-review.md` | Retain | Audit evidence |
| `audit/ai-coo-migration-readiness-review.md` | Retain | Audit evidence |
| `audit/business-state-migration-readiness-review.md` | Retain | Audit evidence |
| `audit/dependency-graph.md` | Retain | Dependency evidence |
| `audit/growth-loop-migration-readiness-review.md` | Retain | Audit evidence |
| `audit/interview-authority-migration-readiness-review.md` | Retain | Audit evidence |
| `audit/journey-authority-migration-readiness-review.md` | Retain | Audit evidence |
| `audit/legacy-retirement-report.md` | Retain | Legacy retirement evidence |
| `audit/migration-baseline-report.md` | Retain | Migration evidence |
| `audit/phase-2a-funneltype-migration.md` | Retain | Migration evidence |
| `audit/runtime-dependency-map.md` | Retain | Runtime dependency evidence |

## Non-Authorization

This inventory does not authorize cleanup, deletion, archive movement, migration, runtime changes, commit, or push.
