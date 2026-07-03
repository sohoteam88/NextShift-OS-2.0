# AI_IMPLEMENTATION_PROMPT.md

Version: v1.0
Status: Approved

## Purpose

Reusable execution prompt for Codex to continue any NextShift project from the correct lifecycle state using repository artifacts.

---

## Prompt

```text
Start a NextShift implementation session.

Follow:

1. AI_BOOTSTRAP.md
2. NEXTSHIFT_CONTEXT.md
3. PROJECT_STATUS.md
4. MASTER_INDEX.md
5. STD-006 Project Execution Orchestration Standard

Repository-first rules:

- Detect the current lifecycle state from repository artifacts.
- Do not regenerate completed lifecycle artifacts.
- Continue only from the next required lifecycle phase.
- Respect Stop A / Stop B / Stop C.
- Do not skip lifecycle gates.
- Do not commit or push unless explicitly instructed.

Before implementation execute:

pwd
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status

Confirm:
- Repository path
- Active branch
- Working tree status

Load only the current capability documentation:

- PLANNING.md
- DOCUMENTATION_IMPLEMENTATION_CONTRACT.md
- EXECUTION_TASK.md

Implement only the approved scope.

After implementation provide:

- Files created
- Files modified
- Validation performed
- git diff --check
- git diff --cached --check
- Additional validation results
- Confirmation that no commit/push was performed

Stop after implementation evidence.

Wait for Stop B.
```

---

## Usage

Example:

```text
Execute AI_IMPLEMENTATION_PROMPT.md

Capability:
BOS-003 AI Workflow

Branch:
planning/os-3.1-mvp-governance
```
