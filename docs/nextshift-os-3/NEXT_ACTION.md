# Next Action

Version: 1.0

Status: Current

Last Updated: 2026-07-06

---

## Purpose

Define the next required project action for the current lifecycle state.

This file is maintained by [Project Context](PROJECT_CONTEXT.md) and is intentionally narrow so the next continuation does not restart completed phases.

---

## Current Next Action

Complete PCS-001 Project Context System verification and audit.

Required validation:

1. Confirm the Project Context package files exist.
2. Confirm [Project Context](PROJECT_CONTEXT.md) is linked from canonical navigation.
3. Confirm [Next Action](NEXT_ACTION.md) and [AI Handover](AI_HANDOVER.md) reflect the current continuation point.
4. Confirm [Repository Status](REPOSITORY_STATUS.md) captures the current branch and repository baseline.
5. Confirm [Context Checksum](CONTEXT_CHECKSUM.md) is updated after context package changes.
6. Run repository documentation validation required by the active task.

---

## Do Not Restart

Do not restart:

- RM-001 workflow metadata synchronization
- RM-001 audit verification
- Business OS v1.0 release preparation
- WF-001 through WF-007 workflow implementation

Those phases are already represented by repository artifacts.

---

## Next Lifecycle Decision

After PCS-001 verification:

- If validation passes, prepare the PCS-001 audit or release artifact only when requested.
- If validation fails, correct only the failing Project Context System artifact.
- Do not commit or push unless explicitly requested.
