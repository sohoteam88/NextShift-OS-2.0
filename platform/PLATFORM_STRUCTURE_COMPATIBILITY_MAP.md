# Platform Structure Compatibility Map

Project: Repository Modernization Program v1.0
Wave: RMP-002 Platform Structure Migration
Status: Implementation package for review

## Purpose

This compatibility map preserves current platform and documentation paths while defining future platform structure handling.

## Compatibility Principle

Current paths remain active until new target paths exist, registries link to them, markdown links validate, and old-path retirement is separately approved.

## Compatibility Map

| Current Path | Future Target | Artifact Class | RMP-002 Action | Retirement Status |
| --- | --- | --- | --- | --- |
| [platform/index.md](index.md) | `platform/index.md` | Platform registry | Retain | Not eligible |
| [platform/status.md](status.md) | `platform/status.md` | Platform status | Retain | Not eligible |
| [docs/nextshift-os-3/README.md](../docs/nextshift-os-3/README.md) | `platform/projects/nextshift-os/README.md` | Documentation root | Map only | Not eligible |
| [docs/nextshift-os-3/MASTER_INDEX.md](../docs/nextshift-os-3/MASTER_INDEX.md) | `platform/projects/nextshift-os/MASTER_INDEX.md` | Master index | Map only | Not eligible |
| [docs/nextshift-os-3/PROJECT_STATUS.md](../docs/nextshift-os-3/PROJECT_STATUS.md) | `platform/projects/nextshift-os/PROJECT_STATUS.md` | Project status | Map only | Not eligible |
| [docs/nextshift-os-3/PROJECT_ROADMAP.md](../docs/nextshift-os-3/PROJECT_ROADMAP.md) | `platform/projects/nextshift-os/PROJECT_ROADMAP.md` | Project roadmap | Map only | Not eligible |
| [docs/nextshift-os-3/CAPABILITY_STATUS.md](../docs/nextshift-os-3/CAPABILITY_STATUS.md) | `platform/projects/nextshift-os/CAPABILITY_STATUS.md` | Capability status | Map only | Not eligible |
| [docs/nextshift-os-3/RUNTIME_STATUS.md](../docs/nextshift-os-3/RUNTIME_STATUS.md) | None in RMP-002 | Runtime status | Retain | Excluded |

## Stub Rules

Compatibility stubs are required before any future source path is retired.

Stub content must include:

- Current artifact identity.
- New canonical path.
- Historical path note.
- Link to the active registry.
- Retirement approval reference.

## Registry Rules

Future registry updates must:

- Preserve [Platform Index](index.md).
- Preserve [Platform Status](status.md).
- Link package artifacts only after review approval.
- Link future paths as future targets until implementation.
- Keep release discovery delegated to [Release Index](../releases/index.md).
- Keep audit discovery delegated to [Audit Index](../audit/index.md).
- Keep governance discovery delegated to [Governance Index](../governance/index.md).

## Protected Reference Classes

RMP-002 compatibility must preserve:

- Release references.
- Audit references.
- Requirements verification references.
- Governance standard references.
- Master index references.
- Project roadmap references.
- Platform registry references.

## Stop Conditions

Stop if:

- A current path is removed.
- A release or audit link becomes undiscoverable.
- Runtime migration is introduced.
- A future target is treated as active before implementation.
- Old-path retirement is attempted without approval.

## Compatibility Decision

RMP-002 maps platform structure compatibility but does not retire or delete any existing path.
