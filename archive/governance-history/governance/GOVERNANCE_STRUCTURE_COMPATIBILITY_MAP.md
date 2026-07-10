# Governance Structure Compatibility Map

Project: Repository Modernization Program v1.0
Wave: RMP-003 Governance Migration Execution
Status: Implementation package for review

## Purpose

This compatibility map preserves current governance, standards, ADR, RFC, and AI governance paths while defining future governance structure handling.

## Compatibility Principle

Current paths remain active until new target paths exist, registries link to them, markdown links validate, and old-path retirement is separately approved.

## Compatibility Map

| Current Path | Future Target | Artifact Class | RMP-003 Action | Retirement Status |
| --- | --- | --- | --- | --- |
| [governance/index.md](index.md) | `governance/index.md` | Governance registry | Retain | Not eligible |
| [governance/repository/](repository/) | `governance/repository/` | Repository governance framework | Retain | Not eligible |
| [docs/nextshift-os-3/constitution/README.md](../docs/nextshift-os-3/constitution/README.md) | `governance/constitution/README.md` | Constitution index | Map only | Not eligible |
| [docs/nextshift-os-3/constitution/AI_CHARTER.md](../docs/nextshift-os-3/constitution/AI_CHARTER.md) | `governance/constitution/AI_CHARTER.md` | Constitution artifact | Map only | Not eligible |
| [docs/nextshift-os-3/constitution/AI_PRINCIPLES.md](../docs/nextshift-os-3/constitution/AI_PRINCIPLES.md) | `governance/constitution/AI_PRINCIPLES.md` | Constitution artifact | Map only | Not eligible |
| [docs/nextshift-os-3/engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md) | `governance/engineering/standards/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md` | Engineering standard | Map only | Not eligible |
| [docs/nextshift-os-3/engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md](../docs/nextshift-os-3/engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md) | `governance/ai/STD-002_AI_ROLE_FRAMEWORK_v1.0.md` | AI standard | Map only | Not eligible |
| [docs/nextshift-os-3/engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-003_DOCUMENTATION_STANDARD_v1.0.md) | `governance/documentation/STD-003_DOCUMENTATION_STANDARD_v1.0.md` | Documentation standard | Map only | Not eligible |
| [docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md](../docs/nextshift-os-3/engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md) | `governance/release/STD-004_RELEASE_GOVERNANCE_v1.0.md` | Release governance standard | Map only | Not eligible |
| [docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md) | `governance/github/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md` | GitHub standard | Map only | Not eligible |
| [docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md) | `governance/engineering/standards/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md` | Orchestration standard | Map only | Not eligible |
| [docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md](../docs/nextshift-os-3/engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md) | `governance/engineering/standards/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.1.md` | Orchestration standard | Map only | Not eligible |
| [docs/nextshift-os-3/engineering/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md](../docs/nextshift-os-3/engineering/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md) | `governance/repository/STD-007_REPOSITORY_CANONICAL_RESOLUTION_STANDARD_v1.0.md` | Repository standard | Map only | Not eligible |
| [docs/nextshift-os-3/governance/README.md](../docs/nextshift-os-3/governance/README.md) | `governance/product/README.md` and domain indexes | Product and repository governance | Map only | Not eligible |
| [docs/nextshift-os-3/adr/README.md](../docs/nextshift-os-3/adr/README.md) | `governance/architecture/decisions/README.md` | ADR history | Map only | Not eligible |
| [docs/nextshift-os-3/rfc/README.md](../docs/nextshift-os-3/rfc/README.md) | `governance/rfc/README.md` | RFC history | Map only | Not eligible |
| [docs/nextshift-os-3/standards/README.md](../docs/nextshift-os-3/standards/README.md) | `governance/standards/README.md` | Standards index | Map only | Not eligible |

## Stub Rules

Compatibility stubs are required before any future source path is retired.

Stub content must include:

- Current artifact identity.
- New canonical governance path.
- Historical path note.
- Link to [Governance Index](index.md).
- Retirement approval reference.

## Registry Rules

Future registry updates must:

- Preserve [Governance Index](index.md).
- Link RMP-003 package artifacts only after review approval.
- Keep current source paths discoverable until movement executes.
- Keep release package discovery delegated to [Release Index](../releases/index.md).
- Keep audit evidence discovery delegated to [Audit Index](../audit/index.md).
- Keep platform discovery delegated to [Platform Index](../platform/index.md).

## Protected Reference Classes

RMP-003 compatibility must preserve:

- Release references.
- Audit references.
- Requirements verification references.
- Governance standard version references.
- AI prompt references.
- Master index references.
- Historical ADR and RFC references.

## Stop Conditions

Stop if:

- A current governance path is removed.
- A governance standard version is renamed.
- A release or audit reference becomes undiscoverable.
- Runtime migration is introduced.
- A future target is treated as active before implementation.
- Old-path retirement is attempted without approval.

## Compatibility Decision

RMP-003 maps governance structure compatibility but does not retire, delete, or move any existing path.
