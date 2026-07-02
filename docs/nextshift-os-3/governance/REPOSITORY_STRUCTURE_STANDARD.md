# Repository Structure Standard

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define the canonical repository structure for NextShift OS so code, documentation, governance, platform projects, and capabilities evolve consistently.

---

## Repository Layers

```text
Repository
|
|-- docs/
|   |-- architecture/
|   |-- nextshift-os-3/
|   |-- governance/
|   |-- audit/
|   `-- standards/
|
|-- packages/
|   |-- shared/
|   |-- domain/
|   |-- application/
|   |-- business-brain/
|   |-- decision-brain/
|   |-- execution-layer/
|   |-- learning-system/
|   `-- ui/
|
|-- apps/
|-- scripts/
`-- infrastructure/
```

---

## Documentation Ownership

## Architecture

Defines long-term system design.

## Governance

Defines rules, standards, workflows, and policies.

## Platform Projects

Reusable platform foundations such as:

- Design System
- UI Kit
- Workspace Experience Framework

## Capabilities

Business functionality delivered in slices.

---

## Repository Rules

- Documentation before implementation.
- Every capability has a release package.
- Every platform project has planning, verification, audit, and release.
- All changes are traceable through GitHub history.

---

## Directory Principles

- One responsibility per folder.
- Stable public structure.
- Predictable naming conventions.
- Minimize duplication.
- Cross-link authoritative documents.

---

## Success Criteria

Any contributor can locate architecture, governance, implementation, verification, audit, and release artifacts within minutes using a consistent repository layout.

---

## Applies With

- [Governance](GOVERNANCE.md)
- [Document Hierarchy Standard](DOCUMENT_HIERARCHY_STANDARD.md)
- [Traceability Standard](TRACEABILITY_STANDARD.md)
- [STD-005 GitHub Alignment Standard v1.0](../engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md)
