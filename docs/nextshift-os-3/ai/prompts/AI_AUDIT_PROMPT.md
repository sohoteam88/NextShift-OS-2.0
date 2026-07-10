# AI_AUDIT_PROMPT.md

Version: v1.0

## Purpose
Reusable Stop B Repository Audit prompt.

## Prompt
```text
Start a NextShift repository audit.

Load:
- AI_BOOTSTRAP.md
- PROJECT_STATUS.md
- STD-006

Repository-first:
- Audit current repository artifacts only.

Run:
pwd
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status
git diff --check
git diff --cached --check

Audit:
- Documentation completeness
- Navigation integrity
- Cross references
- Capability mapping
- Repository consistency
- Scope compliance

Produce:
- Repository Audit Report
- PASS / FAIL / CONDITIONAL PASS
- Required corrections
- Release recommendation

Stop after audit.
```
