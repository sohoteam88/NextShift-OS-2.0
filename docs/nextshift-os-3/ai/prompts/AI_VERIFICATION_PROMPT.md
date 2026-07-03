# AI_VERIFICATION_PROMPT.md

Version: v1.0

## Purpose
Reusable Stop B prompt for Requirements Verification.

## Prompt
```text
Start a NextShift verification session.

Load:
- AI_BOOTSTRAP.md
- NEXTSHIFT_CONTEXT.md
- PROJECT_STATUS.md
- MASTER_INDEX.md
- STD-006 Project Execution Orchestration Standard

Repository-first:
- Detect lifecycle state from repository artifacts.
- Do not regenerate completed artifacts.
- Verify only the current capability.

Run:
pwd
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status
git diff --check
git diff --cached --check

Compare implementation against:
- PLANNING.md
- DOCUMENTATION_IMPLEMENTATION_CONTRACT.md
- EXECUTION_TASK.md

Produce:
- REQUIREMENTS_VERIFICATION.md
- PASS / FAIL / CONDITIONAL PASS
- Missing deliverables
- Scope violations
- Recommendation for Repository Audit

Stop after Requirements Verification.
```
