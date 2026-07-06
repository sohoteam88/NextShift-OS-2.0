# AI Handover

Version: 1.0

Status: Current

Last Updated: 2026-07-06

---

## Purpose

Provide the continuation handover for AI assistants working on NextShift OS.

This file is part of the Project Context System and is governed by [Project Context](PROJECT_CONTEXT.md).

---

## Startup Sequence

For a new AI session:

1. Read [Project Context](PROJECT_CONTEXT.md).
2. Read [Repository Status](REPOSITORY_STATUS.md).
3. Read [Next Action](NEXT_ACTION.md).
4. Read this handover.
5. Read [Context Checksum](CONTEXT_CHECKSUM.md).
6. Load only the additional lifecycle, standard, or implementation files required by the user request.

---

## Current Handover

The repository is on `planning/os-3.1-mvp-governance`.

RM-001 repository synchronization has been implemented, audited, committed, and pushed.

PCS-001 is the active context-system implementation task. It is documentation-only and must not modify runtime code.

---

## Working Rules

- Treat [Project Context](PROJECT_CONTEXT.md) as the context source of truth.
- Use [Repository Status](REPOSITORY_STATUS.md) for branch and repository baseline.
- Use [Next Action](NEXT_ACTION.md) for the next required lifecycle step.
- Keep [Context Checksum](CONTEXT_CHECKSUM.md) current after changing context package files.
- Do not commit or push unless the user explicitly requests it.

---

## Handoff Risks

- Conversation history may include older repository paths and older branch names.
- Use the repository artifacts in this checkout as the current source of truth.
- Do not infer runtime changes from documentation-only PCS tasks.
