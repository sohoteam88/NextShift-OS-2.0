# Governance Index

Status: MU-002 implementation package
Project: Repository Architecture Reset v1.0
Migration Unit: MU-002 Governance Migration

## Purpose

This registry provides the RepoOS governance entry point while preserving current repository paths. MU-002 prepares governance migration review artifacts and does not move existing governance, standards, ADR, RFC, release, audit, or runtime files.

## Registry-First Boundary

- Current governance documents remain in `docs/nextshift-os-3`.
- No standards have been moved or renamed.
- No release governance package has been migrated.
- Runtime code remains unchanged.
- This index is a governance navigation registry and MU-002 package entry point.

## MU-002 Implementation Package

| Artifact | Purpose |
| --- | --- |
| [MU-002 Implementation Plan](MU-002_IMPLEMENTATION_PLAN.md) | Defines the executable governance migration package for review |
| [Governance Migration Record](MIGRATION_RECORD.md) | Consolidates the migration manifest, compatibility map, validation checklist, and rollback checklist |

## Target Governance Domains

| Domain | Future Target | Current Source |
| --- | --- | --- |
| Constitution | `governance/constitution/` | [docs/nextshift-os-3/constitution](../docs/nextshift-os-3/constitution) |
| Engineering standards | `governance/engineering/standards/` | [docs/nextshift-os-3/engineering](../docs/nextshift-os-3/engineering) |
| Product governance | `governance/product/` | [docs/nextshift-os-3/governance](../docs/nextshift-os-3/governance) |
| Repository governance | `governance/repository/` | [docs/nextshift-os-3/governance](../docs/nextshift-os-3/governance) |
| Documentation governance | `governance/documentation/` | [docs/nextshift-os-3/governance](../docs/nextshift-os-3/governance) |
| Release governance | `governance/release/` | [docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md](../docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md) |
| GitHub alignment | `governance/github/` | [docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md) |
| AI governance | `governance/ai/` | [docs/nextshift-os-3/ai](../docs/nextshift-os-3/ai) |
| Architecture decisions | `governance/architecture/decisions/` | [docs/nextshift-os-3/adr](../docs/nextshift-os-3/adr) |
| RFC history | `governance/rfc/` | [docs/nextshift-os-3/rfc](../docs/nextshift-os-3/rfc) |

## Engineering Standards

| Standard | Current Path |
| --- | --- |
| Engineering standards root | [docs/nextshift-os-3/engineering/README.md](../docs/nextshift-os-3/engineering/README.md) |
| Engineering standards overview | [docs/nextshift-os-3/engineering/ENGINEERING_STANDARDS.md](../docs/nextshift-os-3/engineering/ENGINEERING_STANDARDS.md) |
| STD-001 Engineering Workflow | [docs/nextshift-os-3/engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md) |
| STD-002 AI Role Framework | [docs/nextshift-os-3/engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md](../docs/nextshift-os-3/engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md) |
| STD-003 Documentation Standard | [docs/nextshift-os-3/engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md) |
| STD-004 Release Governance | [docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md](../docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md) |
| STD-005 GitHub Alignment Standard | [docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md) |
| STD-006 Project Execution Orchestration Standard v1.0 | [docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md) |
| STD-006 Project Execution Orchestration Standard v1.1 | [docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md](../docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md) |
| STD-007 Repository Canonical Resolution Standard | [docs/nextshift-os-3/engineering/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md) |

## Governance Domains

| Domain | Current Path |
| --- | --- |
| Product governance | [docs/nextshift-os-3/governance/README.md](../docs/nextshift-os-3/governance/README.md) |
| Constitution | [docs/nextshift-os-3/constitution/README.md](../docs/nextshift-os-3/constitution/README.md) |
| Architecture decisions | [docs/nextshift-os-3/adr/README.md](../docs/nextshift-os-3/adr/README.md) |
| RFCs | [docs/nextshift-os-3/rfc/README.md](../docs/nextshift-os-3/rfc/README.md) |
| Standards library | [docs/nextshift-os-3/standards/README.md](../docs/nextshift-os-3/standards/README.md) |
| AI governance and execution | [docs/nextshift-os-3/ai/README.md](../docs/nextshift-os-3/ai/README.md) |

## Repository Cleanup Program

| Artifact | Current Path |
| --- | --- |
| Repository Operations Framework v1.0 | [governance/repository/REPOSITORY_OPERATIONS_FRAMEWORK_v1.0.md](repository/REPOSITORY_OPERATIONS_FRAMEWORK_v1.0.md) |
| Repository Capability Model v1.0 | [governance/repository/REPOSITORY_CAPABILITY_MODEL_v1.0.md](repository/REPOSITORY_CAPABILITY_MODEL_v1.0.md) |
| Repository Runtime Architecture v1.0 | [governance/repository/REPOSITORY_RUNTIME_ARCHITECTURE_v1.0.md](repository/REPOSITORY_RUNTIME_ARCHITECTURE_v1.0.md) |
| Repository Runtime Integration v1.0 | [governance/repository/REPOSITORY_RUNTIME_INTEGRATION_v1.0.md](repository/REPOSITORY_RUNTIME_INTEGRATION_v1.0.md) |
| Repository Health Framework v1.0 | [governance/repository/REPOSITORY_HEALTH_FRAMEWORK_v1.0.md](repository/REPOSITORY_HEALTH_FRAMEWORK_v1.0.md) |
| RCP master index | [governance/repository/rcp/MASTER_INDEX.md](repository/rcp/MASTER_INDEX.md) |
| RCP program charter | [governance/repository/rcp/PROGRAM_CHARTER.md](repository/rcp/PROGRAM_CHARTER.md) |
| RCP program roadmap | [governance/repository/rcp/PROGRAM_ROADMAP.md](repository/rcp/PROGRAM_ROADMAP.md) |
| RCP program governance | [governance/repository/rcp/PROGRAM_GOVERNANCE.md](repository/rcp/PROGRAM_GOVERNANCE.md) |
| RCP cleanup framework v1.1 | [governance/repository/rcp/REPOSITORY_CLEANUP_FRAMEWORK_v1.1.md](repository/rcp/REPOSITORY_CLEANUP_FRAMEWORK_v1.1.md) |
| RCP status | [governance/repository/rcp/STATUS.md](repository/rcp/STATUS.md) |
| RCP-000 release approval record | [governance/repository/rcp/releases/RCP_v1.0_INIT/APPROVAL_RECORD.md](repository/rcp/releases/RCP_v1.0_INIT/APPROVAL_RECORD.md) |
| RCP-000 release checklist | [governance/repository/rcp/releases/RCP_v1.0_INIT/RELEASE_CHECKLIST.md](repository/rcp/releases/RCP_v1.0_INIT/RELEASE_CHECKLIST.md) |
| RCP-000 release notes | [governance/repository/rcp/releases/RCP_v1.0_INIT/RELEASE_NOTES.md](repository/rcp/releases/RCP_v1.0_INIT/RELEASE_NOTES.md) |
| RCP-001 planning | [governance/repository/rcp/RCP-001-cleanup-pilot/PLANNING.md](repository/rcp/RCP-001-cleanup-pilot/PLANNING.md) |
| RCP-001 cleanup contract | [governance/repository/rcp/RCP-001-cleanup-pilot/CLEANUP_CONTRACT.md](repository/rcp/RCP-001-cleanup-pilot/CLEANUP_CONTRACT.md) |
| RCP-001 execution task | [governance/repository/rcp/RCP-001-cleanup-pilot/EXECUTION_TASK.md](repository/rcp/RCP-001-cleanup-pilot/EXECUTION_TASK.md) |
| RCP-001 implementation plan | [governance/repository/rcp/RCP-001-cleanup-pilot/IMPLEMENTATION_PLAN.md](repository/rcp/RCP-001-cleanup-pilot/IMPLEMENTATION_PLAN.md) |
| RCP-001 implementation task | [governance/repository/rcp/RCP-001-cleanup-pilot/IMPLEMENTATION_TASK.md](repository/rcp/RCP-001-cleanup-pilot/IMPLEMENTATION_TASK.md) |
| RCP-001 repository audit contract | [governance/repository/rcp/RCP-001-cleanup-pilot/REPOSITORY_AUDIT_CONTRACT.md](repository/rcp/RCP-001-cleanup-pilot/REPOSITORY_AUDIT_CONTRACT.md) |
| RCP-001 archive manifest | [archive/audit/templates/ARCHIVE_MANIFEST.md](../archive/audit/templates/ARCHIVE_MANIFEST.md) |
| RCP-001 release approval record | [governance/repository/rcp/releases/RCP_001_CLEANUP_PILOT/APPROVAL_RECORD.md](repository/rcp/releases/RCP_001_CLEANUP_PILOT/APPROVAL_RECORD.md) |
| RCP-001 cleanup completion report | [governance/repository/rcp/releases/RCP_001_CLEANUP_PILOT/CLEANUP_COMPLETION_REPORT.md](repository/rcp/releases/RCP_001_CLEANUP_PILOT/CLEANUP_COMPLETION_REPORT.md) |
| RCP-001 release checklist | [governance/repository/rcp/releases/RCP_001_CLEANUP_PILOT/RELEASE_CHECKLIST.md](repository/rcp/releases/RCP_001_CLEANUP_PILOT/RELEASE_CHECKLIST.md) |
| RCP-001 release notes | [governance/repository/rcp/releases/RCP_001_CLEANUP_PILOT/RELEASE_NOTES.md](repository/rcp/releases/RCP_001_CLEANUP_PILOT/RELEASE_NOTES.md) |
| RCP-001 pilot retrospective | [governance/repository/rcp/RCP-001-cleanup-pilot/RCP_001_PILOT_RETROSPECTIVE.md](repository/rcp/RCP-001-cleanup-pilot/RCP_001_PILOT_RETROSPECTIVE.md) |
| RCP-001 wave closure | [governance/repository/rcp/RCP-001-cleanup-pilot/RCP_001_WAVE_CLOSURE.md](repository/rcp/RCP-001-cleanup-pilot/RCP_001_WAVE_CLOSURE.md) |

## Release Governance Packages

| Release Package | Current Path |
| --- | --- |
| Engineering Standards v1.0 | [docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md](../docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md) |
| Engineering Standards v1.1 | [docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/README.md](../docs/nextshift-os-3/engineering/releases/ENGINEERING_STANDARDS_v1.1/README.md) |

## Companion Registries

- [Platform index](../platform/index.md)
- [Platform status](../platform/status.md)
- [Release index](../releases/index.md)
- [Audit index](../audit/index.md)

## Compatibility Notes

- Current governance paths remain active until a later approved migration executes file movement.
- Future target paths are review targets only unless and until approved `git mv` operations are executed.
- Engineering standards release packages are excluded from MU-002 migration.
- Runtime migration, release package migration, audit migration, and platform project migration remain out of scope.
