# AI Workflow Governance

Version: 1.0

Status: Implemented

Last Updated: 2026-07-08

---

## Purpose

Define governed AI execution expectations for NextShift engineering work.

---

## Session Startup

AI sessions must begin from canonical repository context.

Required startup evidence should include:

- current branch
- current HEAD
- `git status --short`
- applicable bootstrap or context documents
- task-specific planning, implementation, verification, audit, or release package

---

## Context Loading

When a chat bootstrap package is used:

1. Load the manifest first.
2. Load the context package before inspecting repository files.
3. Confirm the target branch and project state.
4. Continue only from the next required lifecycle artifact.

---

## Repository Inspection

AI execution must inspect repository files before editing.

Required inspection should include:

- task source documents
- relevant index or README files
- current implementation artifacts
- current Git state

---

## Stop Conditions

AI sessions must stop when:

- the approved task scope is complete
- validation has been run or a validation blocker is reported
- a lifecycle boundary is reached
- a task requests no commit or no push
- required user approval is needed for destructive, deployment, or out-of-scope work

---

## Evidence Reporting

Final reports must include:

- files changed
- functional scope completed
- validation results
- known limitations
- Git status
- commit and push status

AI summaries must distinguish completed work from generated packages, proposed work, and future lifecycle steps.
