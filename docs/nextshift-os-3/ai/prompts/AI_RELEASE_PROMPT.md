# AI_RELEASE_PROMPT.md

Version: v1.0

## Purpose
Reusable Stop C release prompt.

## Prompt
```text
Start NextShift release preparation.

Load:
- AI_BOOTSTRAP.md
- PROJECT_STATUS.md
- STD-004
- STD-005
- STD-006

Confirm:
- Requirements Verification PASS
- Repository Audit PASS
- All required corrections applied

Run:
pwd
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status
git diff --check
git diff --cached --check

If release approved, generate:
- RELEASE_DECISION.md
- RELEASE_NOTES.md
- NEXT_PHASE_HANDOFF.md

Only when explicitly instructed:
git add .
git commit
git push

Report:
- Commit SHA
- Push result
- Final repository status

Stop after release completion.
```
