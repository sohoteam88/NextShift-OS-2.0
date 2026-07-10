# STD-006 Project Execution Orchestration Standard v1.0

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define how NextShift engineering standards work together during an end-to-end project.

STD-006 coordinates project execution. It does not replace or duplicate:

- [NextShift Engineering Workflow Standard (NEWS) v1.0](NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md)
- [STD-002 AI Role Framework v1.0](STD-002_AI_ROLE_FRAMEWORK_v1.0.md)
- [STD-003 Documentation Standard v1.0](STD-003_DOCUMENTATION_STANDARD_v1.0.md)
- [STD-004 Release Governance v1.0](STD-004_RELEASE_GOVERNANCE_v1.0.md)
- [STD-005 GitHub Alignment Standard v1.0](STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md)

---

## Scope

Applies to:

- Capability projects
- Platform projects
- Architecture milestones
- Design System work
- UI Kit work
- Workspace Experience Framework work
- Future NextShift project families

---

## Project State Machine

The canonical project states are:

```text
Planning
  -> Documentation
  -> Implementation
  -> Verification
  -> Audit
  -> Release Preparation
  -> Production
  -> Maintenance
```

Lifecycle details are governed by [NextShift Engineering Workflow Standard (NEWS) v1.0](NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md).

### Planning

Project or slice scope, dependencies, acceptance criteria, and risks are defined.

### Documentation

Contracts, execution tasks, and required project or slice artifacts are prepared.

### Implementation

Codex or the assigned implementation role updates the repository according to the contract.

### Verification

Requirements and acceptance criteria are checked against the implementation.

### Audit

An independent audit reviews repository state, architecture consistency, and release readiness.

### Release Preparation

Release decision, release notes, release package, and alignment checks are produced.

### Production

Production deployment occurs only when the release level requires it and all release gates pass.

### Maintenance

Released work is monitored, corrected, extended, or superseded through a new lifecycle pass.

---

## Three Stop Point Orchestration

NextShift project execution uses three operator-visible stop points.

### Stop A - Planning To Implementation

Generate:

- Planning
- Documentation Implementation Contract
- Execution Task

Handoff:

- Codex receives the contract and execution task.
- Codex implements only the assigned repository changes.
- Codex returns implementation evidence.

### Stop B - Implementation To Audit

After implementation evidence is available, generate:

- Requirements Verification
- Repository Audit Contract

Handoff:

- Claude or the assigned Audit Engineer receives the audit contract.
- The Audit Engineer performs independent repository audit.
- The Audit Engineer returns audit result, findings, corrective actions, recommendation, and next phase.

### Stop C - Audit To Next Phase

After audit evidence is available, generate:

- Release Decision
- Release Notes
- Next Slice or Phase Planning

Handoff:

- Release proceeds only if release governance and alignment gates pass.
- If findings remain, return to the earliest failed state.
- If release completes, continue to the next slice, next phase, production, or maintenance.

---

## Continuation Protocol

When the operator requests `continue` or an equivalent continuation:

1. Determine the current project state from repository artifacts.
2. Identify the next missing required artifact.
3. Generate only that artifact or handoff.
4. Do not restart an already completed lifecycle phase.
5. Do not regenerate approved artifacts unless the operator explicitly requests revision.
6. Stop at the next required handoff point.

Continuation must be state-driven, not conversation-memory-driven.

---

## Project State Detection

The current execution phase is determined from repository artifacts in this order:

1. Locate the project, capability, slice, or milestone directory.
2. Check required planning artifacts.
3. Check contract and execution task artifacts.
4. Check implementation report or implementation evidence.
5. Check requirements verification result.
6. Check audit contract and audit report.
7. Check release notes and release decision.
8. Check release package, deployment manifest, and alignment report when applicable.
9. Check release branch, tag, and production alignment when applicable.

State detection rules:

- Missing planning means state is `Planning`.
- Planning complete but contract missing means state is `Documentation`.
- Contract complete but implementation evidence missing means state is `Implementation`.
- Implementation evidence complete but verification missing means state is `Verification`.
- Verification complete but audit missing means state is `Audit`.
- Audit complete but release artifacts missing means state is `Release Preparation`.
- Release artifacts complete and production alignment required means state is `Production`.
- Released work with no active release task means state is `Maintenance`.

Artifact naming and structure are governed by [STD-003 Documentation Standard v1.0](STD-003_DOCUMENTATION_STANDARD_v1.0.md).

---

## Artifact Production Matrix

| State | Required Outputs | Primary Standard |
| --- | --- | --- |
| Planning | Planning | STD-001 / STD-003 |
| Documentation | Documentation Implementation Contract, Execution Task | STD-001 / STD-003 |
| Implementation | Implementation Report, files changed, validation evidence | STD-001 / STD-002 |
| Verification | Requirements Verification | STD-001 / STD-003 |
| Audit | Repository Audit Contract, Audit Report | STD-001 / STD-002 |
| Release Preparation | Release Decision, Release Notes, Release Package | STD-004 |
| Production | Deployment Manifest, VPS Alignment Report, Health Check Evidence | STD-004 / STD-005 |
| Maintenance | Completion Report, Change Plan, Supersession Notes, if applicable | STD-003 / STD-004 |

Document structure, metadata, naming, and traceability are governed by [STD-003 Documentation Standard v1.0](STD-003_DOCUMENTATION_STANDARD_v1.0.md).

---

## Standard Dependency Map

```text
STD-006 Project Execution Orchestration
  coordinates:
    STD-001 Engineering Workflow
    STD-002 AI Role Framework
    STD-003 Documentation Standard
    STD-004 Release Governance
    STD-005 GitHub Alignment Standard
```

### STD-001

Owns lifecycle stages and stage ordering.

### STD-002

Owns role definitions, role assignment, and separation of duties.

### STD-003

Owns document structure, metadata, naming, and traceability.

### STD-004

Owns release gates, release package, release decision, and release governance.

### STD-005

Owns branch, tag, GitHub, VPS deployed revision, deployment manifest, and production alignment rules.

### STD-006

Owns orchestration across standards, stop points, continuation, state detection, and phase handoff.

---

## Governance Rules

- STD-006 must reference existing standards instead of restating their detailed rules.
- A completed phase must not be restarted during continuation unless a revision is requested.
- A failed gate returns the project to the earliest failed state.
- Handoffs must include enough evidence for the next role to proceed without guessing.
- Production work must follow STD-004 and STD-005 before deployment or release completion.

---

## Applies With

- [NextShift Engineering Workflow Standard (NEWS) v1.0](NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md)
- [STD-002 AI Role Framework v1.0](STD-002_AI_ROLE_FRAMEWORK_v1.0.md)
- [STD-003 Documentation Standard v1.0](STD-003_DOCUMENTATION_STANDARD_v1.0.md)
- [STD-004 Release Governance v1.0](STD-004_RELEASE_GOVERNANCE_v1.0.md)
- [STD-005 GitHub Alignment Standard v1.0](STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md)
- [NextShift Engineering Execution Playbook v1.0](NEXTSHIFT_ENGINEERING_EXECUTION_PLAYBOOK_v1.0.md)
- [Engineering Workflow](ENGINEERING_WORKFLOW.md)
- [Engineering Playbook](ENGINEERING_PLAYBOOK.md)
