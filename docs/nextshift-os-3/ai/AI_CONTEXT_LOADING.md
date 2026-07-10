# AI Context Loading

Version: 1.0

Status: Approved

Last Updated: 2026-07-02

---

## Purpose

Define how AI assistants load enough context to act safely without overloading the session or duplicating existing standards.

---

## Context Loading Sequence

1. Load [AI Bootstrap](AI_BOOTSTRAP.md).
2. Load [Master Index](../MASTER_INDEX.md).
3. Load [NextShift Standards v1.0](../standards/README.md).
4. Load the relevant engineering standard for the task.
5. Load the project, capability, platform, workspace, or release package in scope.
6. Load recent implementation, verification, audit, or release artifacts if continuation is requested.
7. Load [Engineering Automation](../engineering/ENGINEERING_AUTOMATION.md) before using artifact or chat bootstrap generators.

---

## Documentation Priority

Prioritize documents in this order:

1. Canonical standards and governance documents.
2. Project or release package README.
3. Planning and contract artifacts.
4. Implementation reports.
5. Verification and audit reports.
6. Release notes, release manifests, and approval records.
7. Conversation context.

If conversation context conflicts with repository artifacts, trust repository artifacts unless the operator explicitly supersedes them.

---

## Current State Detection

Use repository artifacts to answer:

- What branch is active?
- What project or slice is in scope?
- Which lifecycle artifacts exist?
- Which artifact is the latest authoritative evidence?
- Which validation or audit gate is incomplete?
- Is release or production alignment in scope?

Project state detection is governed by [STD-006 Project Execution Orchestration Standard](../engineering/STD-006_PROJECT_EXECUTION_ORCHESTRATION_STANDARD_v1.0.md).

---

## Next Action Decision Tree

```text
No planning artifact?
  -> Create or request Planning.
Planning exists but contract missing?
  -> Create Documentation Implementation Contract and Execution Task.
Contract exists but implementation evidence missing?
  -> Hand off to implementation.
Implementation evidence exists but verification missing?
  -> Produce Requirements Verification.
Verification passes but audit missing?
  -> Produce Repository Audit Contract.
Audit passes but release artifacts missing?
  -> Produce Release Decision and Release Notes.
Release artifacts exist and production is required?
  -> Run STD-004 and STD-005 release alignment.
Release complete?
  -> Move to next slice, next phase, or maintenance.
```

---

## Recovery From Incomplete Context

When context is incomplete:

1. Inspect repository status and branch.
2. Locate the project folder or release package.
3. List available lifecycle artifacts.
4. Identify the most recent completed state.
5. Continue from the next missing artifact.
6. Record assumptions in the output.

Do not infer completion from conversation memory alone.

---

## Safety Rule

If a requested action could affect release branch, release tags, or VPS production, stop and load [STD-004 Release Governance](../engineering/STD-004_RELEASE_GOVERNANCE_v1.0.md) and [STD-005 GitHub Alignment Standard](../engineering/STD-005_GITHUB_ALIGNMENT_STANDARD_v1.0.md) before acting.
