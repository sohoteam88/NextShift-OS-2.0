# AI Execution Guide

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define how AI assistants execute NextShift work while respecting role boundaries, stop points, continuation, and release discipline.

---

## Planning Workflow

Planning work is owned by the Product Architect role defined in [STD-002 AI Role Framework](../../engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md).

Planning outputs must:

- Define scope.
- Identify dependencies.
- Set acceptance criteria.
- Identify risks.
- Reference the standards baseline.
- Stop at the correct handoff point.

---

## Codex Workflow

Codex work follows the assigned implementation role.

Codex should:

- Read the contract and execution task.
- Inspect relevant repository files before editing.
- Make only scoped changes.
- Produce implementation evidence.
- Run requested validation.
- Avoid verification or audit ownership unless explicitly assigned by the project standard.

Role boundaries are governed by [STD-002 AI Role Framework](../../engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md).

---

## ChatGPT Verification

Verification checks whether implementation satisfies requirements and acceptance criteria.

Verification should:

- Compare deliverables against planning and contract artifacts.
- Identify missing outputs.
- Record pass, fail, or conditional pass.
- Produce the next audit handoff when verification passes.

Verification phase ordering is governed by [STD-001 Engineering Workflow](../../engineering/NEXTSHIFT_ENGINEERING_WORKFLOW_STANDARD_v1.0.md).

---

## Claude Audit

Audit must be independent from implementation.

Audit should:

- Review repository artifacts.
- Check consistency with standards and architecture.
- Identify findings and corrective actions.
- Recommend release, revision, or stop.

Audit role separation is governed by [STD-002 AI Role Framework](../../engineering/STD-002_AI_ROLE_FRAMEWORK_v1.0.md).

---

## Stop A

Generate:

- Planning.
- Documentation Implementation Contract.
- Execution Task.

Then hand off to Codex.

---

## Stop B

After implementation evidence exists, generate:

- Requirements Verification.
- Repository Audit Contract.

Then hand off to Claude or the assigned Audit Engineer.

---

## Stop C

After audit evidence exists, generate:

- Release Decision.
- Release Notes.
- Next Slice or Phase Planning.

Then proceed according to release governance.

Stop point orchestration is governed by [STD-006 Project Execution Orchestration Standard](../../engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md).

---

## Continuation Protocol

When asked to continue:

1. Load project state from repository artifacts.
2. Identify the next missing lifecycle artifact.
3. Generate or execute only the next required action.
4. Stop at the next handoff point.
5. Do not redo completed phases unless revision is requested.

---

## Release And Production Constraints

Release and production work must follow:

- [STD-004 Release Governance](../../engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md)
- [STD-005 GitHub Alignment Standard](../../engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md)

Do not modify release branches, move tags, or touch production unless the task explicitly authorizes that work.
