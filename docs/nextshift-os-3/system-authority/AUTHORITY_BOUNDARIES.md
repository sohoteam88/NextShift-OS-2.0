# Authority Boundaries

Version: 1.0

Status: Current

Last Updated: 2026-07-08

---

## Purpose

Define responsibility boundaries between existing NextShift OS authority documents.

System Authority is the authority router. It locates the correct source document and does not replace, summarize, or redefine that source.

---

## Boundary Principle

The router locates authority.

The source defines authority.

If a question belongs to an existing authority domain, use the canonical source document for that domain instead of creating a parallel authority.

---

## Authority Ownership

| Authority Domain | Source Of Truth | Boundary |
| --- | --- | --- |
| Vision and long-term direction | [NextShift OS 3 Blueprint](../NEXTSHIFT_OS_3_BLUEPRINT.md) | Defines the system vision and long-term product direction. |
| Product roadmap and implementation sequence | [Project Roadmap](../PROJECT_ROADMAP.md) | Defines product direction, product phases, delivery sequencing, and product dependencies. |
| System architecture and component responsibilities | [NextShift Reference Architecture](../phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md) | Defines architecture and component responsibility boundaries. |
| Engineering workflow and governance | [Engineering Playbook](../engineering/ENGINEERING_PLAYBOOK.md) | Defines engineering workflow, governed automation workflow, and execution governance. |
| Engineering rules and standards | [Engineering Standards](../engineering/ENGINEERING_STANDARDS.md) | Defines mandatory engineering rules and standards. |
| Runtime platform scope | [Runtime Platform](../runtime-platform/README.md) | Defines runtime platform scope and lifecycle. |
| Design system scope | [Design System](../design-system/README.md) | Defines design system scope. |
| UI kit scope | [UI Kit](../ui-kit/README.md) | Defines UI kit scope. |
| Workspace platform scope | [Workspace Experience Framework](../workspace-experience-framework/README.md) | Defines workspace platform scope. |
| Current implementation state | Status documents | Report current state only. Status documents must not redefine product direction, architecture, workflow, or standards. |

---

## Status Document Boundary

Status documents include current state files such as:

- [Project Status](../PROJECT_STATUS.md)
- [Blueprint Status](../BLUEPRINT_STATUS.md)
- [Runtime Status](../RUNTIME_STATUS.md)
- [Capability Status](../CAPABILITY_STATUS.md)
- [Workflow Status](../WORKFLOW_STATUS.md)
- [Repository Status](../REPOSITORY_STATUS.md)
- [Next Action](../NEXT_ACTION.md)

These files describe current implementation state, release state, repository state, or immediate next action.

They must not redefine:

- product direction
- product phases
- delivery sequencing
- architecture
- engineering workflow
- engineering standards
- platform boundaries

---

## No Parallel Authority Rule

If an authoritative Blueprint, Roadmap, Architecture, Playbook, or Standard already exists, do not create a parallel authority document.

Allowed change paths:

- amendment to the source document
- approved RFC
- versioned successor with release and audit evidence

Parallel authorities are prohibited.
