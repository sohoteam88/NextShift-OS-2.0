# Dependency Map

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Define dependencies that must be satisfied before Business Foundation implementation begins.

---

## Dependency Summary

| Dependency Area | Required Source | Status Requirement |
| --- | --- | --- |
| Authority | [Authority Boundaries](../system-authority/AUTHORITY_BOUNDARIES.md) | Current |
| Product direction | [Project Roadmap](../PROJECT_ROADMAP.md) | Approved |
| System architecture | [NextShift Reference Architecture](../phase-2-architecture/NEXTSHIFT_REFERENCE_ARCHITECTURE.md) | Approved |
| Business Brain | [Business Brain Architecture](../phase-2-architecture/BUSINESS_BRAIN_ARCHITECTURE.md) | Approved |
| Decision Brain | [Decision Brain Architecture](../phase-2-architecture/DECISION_BRAIN_ARCHITECTURE.md) | Approved |
| Execution Layer | [Execution Layer Architecture](../phase-2-architecture/EXECUTION_LAYER_ARCHITECTURE.md) | Approved |
| Business OS | [Business OS](../business-os/README.md) | Released |
| Runtime Platform | [Runtime Platform](../runtime-platform/README.md) | Released foundation |
| Engineering workflow | [Engineering Playbook](../engineering/ENGINEERING_PLAYBOOK.md) | Version 1.2 current |
| Workflow baseline | [Workflow Releases](../WORKFLOW_RELEASES.md) | Current |

---

## Architecture Dependencies

Business Architecture v1.0 depends on:

- product roadmap authority
- reference architecture authority
- Business Brain and Decision Brain architecture
- execution architecture
- Business OS v1.0 release baseline
- Runtime Platform v1.0 release baseline
- Engineering Playbook v1.2 workflow governance
- System Authority v1.1 authority-router boundaries

---

## Product Dependencies

Business Foundation implementation depends on:

- stable business identity model
- stable business context model
- goals and operating priorities
- Business Brain read model boundaries
- Decision Engine recommendation boundaries
- Conversation Engine approval boundaries
- Creative Studio brief and asset package boundaries
- Growth & Revenue lead, opportunity, campaign, forecast, and insight boundaries

---

## Freeze Dependencies

Before Business Architecture v1.0 can freeze:

- all architecture documents must exist
- dependency map must be complete
- source authority alignment must be verified
- navigation must link the architecture package
- verification must pass
- audit must pass
- release package must be complete
- Git release checkpoint must be complete
