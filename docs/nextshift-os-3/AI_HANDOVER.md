# AI Handover

Version: 1.0

Status: Current

Last Updated: 2026-07-09

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

The repository is on `planning/os-3.3-runtime-platform`.

RM-001 repository synchronization, PCS-001 context system, PCS-002 context package generator, INT-001 platform integration validation, and DEP-001 deployment readiness review have been completed and pushed.

CODEX execution plan Phase 1 status documentation repair is the active task. It is documentation-only and must not modify Prisma, env, deployment configuration, runtime packages, tags, or release promotion state.

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
- Do not infer production deployment from OS 3.3 planning branch artifacts.
- Do not execute Phase 1.5 or later phases unless explicitly requested.
