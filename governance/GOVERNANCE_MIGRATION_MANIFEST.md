# Governance Migration Manifest

Project: Repository Architecture Reset v1.0
Migration Unit: MU-002 Governance Migration
Status: Review manifest

## Purpose

This manifest maps current governance assets to future RepoOS governance locations. It is a review artifact and does not mean the files have moved.

## Source-to-Target Map

| Source Path | Future Target Path | Artifact Class | Compatibility Action | Migration Status |
| --- | --- | --- | --- | --- |
| `docs/nextshift-os-3/constitution/README.md` | `governance/constitution/README.md` | Constitution | Old-path stub or retained index | Planned |
| `docs/nextshift-os-3/constitution/AI_CHARTER.md` | `governance/constitution/AI_CHARTER.md` | Constitution | Old-path stub | Planned |
| `docs/nextshift-os-3/constitution/AI_PRINCIPLES.md` | `governance/constitution/AI_PRINCIPLES.md` | Constitution | Old-path stub | Planned |
| `docs/nextshift-os-3/engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md` | `governance/engineering/standards/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md` | Engineering standard | Old-path stub | Planned |
| `docs/nextshift-os-3/engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md` | `governance/ai/STD-002_AI_ROLE_FRAMEWORK_v1.0.md` | AI standard | Old-path stub | Planned |
| `docs/nextshift-os-3/engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md` | `governance/documentation/STD-003_DOCUMENTATION_STANDARD_v1.0.md` | Documentation standard | Old-path stub | Planned |
| `docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md` | `governance/release/STD-004_RELEASE_GOVERNANCE_v1.0.md` | Release standard | Old-path stub | Planned |
| `docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md` | `governance/github/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md` | GitHub standard | Old-path stub | Planned |
| `docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md` | `governance/engineering/standards/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md` | Orchestration standard | Old-path stub | Planned |
| `docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md` | `governance/engineering/standards/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md` | Orchestration standard | Old-path stub | Planned |
| `docs/nextshift-os-3/engineering/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md` | `governance/repository/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md` | Repository standard | Old-path stub | Planned |
| `docs/nextshift-os-3/governance/PRODUCT_GOVERNANCE_CHARTER.md` | `governance/product/PRODUCT_GOVERNANCE_CHARTER.md` | Product governance | Old-path stub | Planned |
| `docs/nextshift-os-3/governance/PRODUCT_DECISION_FRAMEWORK.md` | `governance/product/PRODUCT_DECISION_FRAMEWORK.md` | Product governance | Old-path stub | Planned |
| `docs/nextshift-os-3/governance/PRODUCT_BACKLOG_STANDARD.md` | `governance/product/PRODUCT_BACKLOG_STANDARD.md` | Product governance | Old-path stub | Planned |
| `docs/nextshift-os-3/governance/REPOSITORY_STRUCTURE_STANDARD.md` | `governance/repository/REPOSITORY_STRUCTURE_STANDARD.md` | Repository governance | Old-path stub | Planned |
| `docs/nextshift-os-3/governance/CHANGE_MANAGEMENT_STANDARD.md` | `governance/repository/CHANGE_MANAGEMENT_STANDARD.md` | Repository governance | Old-path stub | Planned |
| `docs/nextshift-os-3/governance/DOCUMENT_STANDARDS.md` | `governance/documentation/DOCUMENT_STANDARDS.md` | Documentation governance | Old-path stub | Planned |
| `docs/nextshift-os-3/governance/DOCUMENT_HIERARCHY_STANDARD.md` | `governance/documentation/DOCUMENT_HIERARCHY_STANDARD.md` | Documentation governance | Old-path stub | Planned |
| `docs/nextshift-os-3/adr/` | `governance/architecture/decisions/` | Architecture decisions | Old-path retained index | Planned |
| `docs/nextshift-os-3/rfc/` | `governance/rfc/` | RFC history | Old-path retained index | Planned |
| `docs/nextshift-os-3/standards/README.md` | `governance/standards/README.md` | Standards index | Old-path stub | Planned |

## Excluded From MU-002

| Source Path | Reason |
| --- | --- |
| `docs/nextshift-os-3/engineering/releases/` | Release package migration excluded |
| `audit/` | Audit migration excluded |
| `docs/nextshift-os-3/business-os/` | Platform project migration excluded |
| `src/` | Runtime migration excluded |
| `packages/` | Runtime package migration excluded |

## Future Git Operation Rule

Future approved migration should use `git mv` for file movement where practical. This package does not execute those moves.
