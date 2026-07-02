# AI Onboarding Guide

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define how an AI assistant joins an existing NextShift project without losing context, duplicating work, or bypassing the standards baseline.

---

## Onboarding Process

1. Read [AI Bootstrap](AI_BOOTSTRAP.md).
2. Confirm the active branch and working tree status.
3. Identify whether the task is planning, documentation, implementation, verification, audit, release, or maintenance.
4. Load only the canonical documents needed for the task.
5. Detect the current project state from repository artifacts.
6. Continue from the next required state instead of restarting completed phases.

---

## Project Discovery

Determine scope from:

- User request.
- Current branch.
- File paths mentioned in the request.
- Project folder under `docs/nextshift-os-3/`.
- Release package or manifest in scope.
- Capability, platform project, workspace, or engineering standard referenced by the task.

When the task scope is unclear, inspect repository artifacts before asking for clarification.

---

## Active Branch Detection

Use branch state to determine risk:

- `planning/*` means future planning, standards, architecture, and documentation work.
- `release/*` means release-candidate work and requires release discipline.
- `feature/*` means implementation work before release qualification.
- `hotfix/*` means urgent production-fix work.

Branch rules are governed by [STD-005 GitHub Alignment Standard](../engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md).

---

## Execution Phase Detection

Use the project state machine in [STD-006 Project Execution Orchestration Standard](../engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md).

Evidence sources:

- Planning documents.
- Contracts.
- Execution tasks.
- Implementation reports.
- Requirements verification.
- Audit contracts and audit reports.
- Release notes.
- Release manifests and packages.
- Git branch, tag, and deployment alignment evidence when production is in scope.

---

## Duplicate Work Avoidance

Before creating or editing artifacts:

- Search for an existing canonical document.
- Prefer updating navigation over creating a duplicate standard.
- Reference existing standards rather than restating them.
- Preserve release package documents as summaries, not canonical replacements.
- Do not regenerate completed lifecycle artifacts unless revision is explicitly requested.

---

## Onboarding Output

After onboarding, the assistant should know:

- Current branch.
- Current project state.
- Relevant canonical documents.
- Next required artifact or action.
- Whether the task is safe to complete without touching release branch, tags, or VPS.
