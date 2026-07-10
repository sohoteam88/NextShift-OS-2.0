# BOS-005 Execution Task

Version: v1.0
Status: Ready for Codex
Capability: BOS-005 Business Automation
Lifecycle Phase: Stop A - Execution Task

---

## Goal

Create BOS-005 Business Automation documentation in the repository and update Business OS navigation.

This task must produce actual repository files, not only planning artifacts.

---

## Repository Target

Create:

```text
docs/nextshift-os-3/business-os/phase-1/BOS-005-business-automation/
```

---

## Required Files To Create

Inside the BOS-005 directory:

1. `README.md`
2. `PLANNING.md`
3. `DOCUMENTATION_IMPLEMENTATION_CONTRACT.md`
4. `ARCHITECTURE.md`
5. `CAPABILITY_MATRIX.md`
6. `DEPENDENCY_MODEL.md`
7. `IMPLEMENTATION_STATUS.md`

---

## Required Files To Update

Update:

1. `docs/nextshift-os-3/business-os/README.md`
2. `docs/nextshift-os-3/business-os/phase-1/PLANNING.md`
3. `docs/nextshift-os-3/MASTER_INDEX.md`
4. `docs/nextshift-os-3/PROJECT_ROADMAP.md`

---

## Required Content Model

Use BOS-005 as a documentation-only capability that establishes the Business Automation layer.

The documentation must consistently represent these areas:

- Scheduler
- Trigger Engine
- Rule Engine
- Automation Pipeline
- Background Jobs
- Automation Governance
- Workflow-to-Automation handoff
- Workspace-aware automation context

The documentation must clearly show:

```text
BOS-003 AI Workflow
        ↓
BOS-004 Workspace Experience
        ↓
BOS-005 Business Automation
        ↓
BOS-006 Business Memory / BOS-007 Event Platform
```

---

## Validation Commands

Run:

```bash
git status
git diff --check
git diff --cached --check
```

Run scoped relative link validation for the updated Business OS docs.

Do not run runtime tests unless code files are changed.

---

## Do Not Commit

Do not commit or push unless explicitly instructed by the operator.

Stop after implementation evidence is produced.

---

## Required Final Report

Return:

- Files created
- Files modified
- Validation result
- Relative link validation result
- Git status
- Confirmation that BOS-005 Stop A artifacts exist in the repository
- Confirmation that no commit/push was performed
