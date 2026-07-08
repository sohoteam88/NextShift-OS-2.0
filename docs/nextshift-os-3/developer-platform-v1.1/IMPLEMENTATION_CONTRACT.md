# Developer Platform v1.1 Workflow Hardening Implementation Contract

Version: 1.0

Status: Stop A Ready

Last Updated: 2026-07-08

---

## Objective

Implement Developer Platform v1.1 Workflow Hardening controls.

This project closes the automation workflow gaps identified by Runtime Platform v1.0 and Developer Platform review before Engineering Playbook v1.2 promotion.

---

## Required Implementation Scope

Implement planning and source changes for:

```text
Markdown Link Validation
Navigation Consistency Checker
Advisory Registry
Scoped Git Checkpoint Checklist
Project Closure Package Generator
Branch Synchronization Report
```

Expected documentation area:

```text
docs/nextshift-os-3/developer-platform-v1.1/
```

Expected script or package integration may include:

```text
package.json
scripts/
docs/nextshift-os-3/engineering/
docs/nextshift-os-3/developer-platform/
```

Only implement files required by the approved Stop B task.

---

## Functional Requirements

### 1. Markdown Link Validation

Add a repository-standard command:

```bash
pnpm docs:links
```

The command should validate Markdown links in repository documentation or clearly document its supported scope.

### 2. Navigation Consistency Checker

Add a check that can identify stale, missing, duplicate, or inconsistent links in major navigation surfaces such as:

- `docs/nextshift-os-3/MASTER_INDEX.md`
- project README files
- release package README files

### 3. Advisory Registry

Create a canonical advisory registry for carry-forward audit findings.

Required fields should include:

- advisory ID
- source project or slice
- severity
- status
- owner or owning area
- resolution target
- carry-forward decision

### 4. Scoped Git Checkpoint Checklist

Create a standard checkpoint checklist that requires release reports to include:

- staged files
- unstaged out-of-scope files
- ignored generated artifacts
- branch name
- HEAD before commit
- commit SHA
- push result
- final branch synchronization

### 5. Project Closure Package Generator

Define or implement a standard project closure package source set for:

- project release summary
- retrospective
- lessons learned
- automation review
- project audit report

### 6. Branch Synchronization Report

Define or implement a standard branch sync report that can be produced after push.

Required evidence should include:

- current branch
- local HEAD
- upstream tracking state
- latest commit
- final working tree status

---

## Boundary Rules

Developer Platform v1.1 must not:

- Implement Engineering Playbook v1.2.
- Change runtime source.
- Add product features.
- Implement deployment platform behavior.
- Commit generated artifacts.
- Modify `docs/nextshift-os-3/context-package/` unless explicitly authorized.
- Treat package generation as lifecycle approval.
- Replace Engineering Playbook v1.1 authority.

---

## Validation Requirements

Run and report:

```bash
git diff --check
git diff --cached --check
```

Additional validation should be added by Stop B if scripts are implemented.

---

## Acceptance Criteria

Developer Platform v1.1 implementation is complete when:

- All six hardening workstreams have documented source artifacts.
- Implemented commands or checklists are reachable from repository documentation.
- Generated artifacts remain untracked.
- Context-package changes are not modified unless explicitly authorized.
- Engineering Playbook v1.2 remains a future promotion step.
