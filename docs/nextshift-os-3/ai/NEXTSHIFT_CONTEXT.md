# NextShift Context

Version: 1.0

Status: Current

Last Updated: 2026-07-03

---

## Purpose

Provide the lightweight AI runtime context entrypoint for NextShift OS sessions.

This file complements [AI Bootstrap](AI_BOOTSTRAP.md), [Project Context](../PROJECT_CONTEXT.md), and [Project Status](../PROJECT_STATUS.md). It routes assistants to the current authoritative records and does not replace or duplicate the project context package or project dashboard.

---

## Runtime Context

| Field | Current State | Canonical Source |
| --- | --- | --- |
| Project Name | NextShift OS | [Project Status](../PROJECT_STATUS.md) |
| Current Version | OS 3.1 RC1 production baseline with OS 3.1 MVP governance planning in progress | [Project Status](../PROJECT_STATUS.md) |
| Current Release Branch | `release/os-3.1-rc1` | [Project Status](../PROJECT_STATUS.md) |
| Current Release Tag | `v3.1.0-rc1` | [Project Status](../PROJECT_STATUS.md) |
| Current Production Commit | `045ddea888991b8454fd393a61de2866174c5561` | [Project Status](../PROJECT_STATUS.md) |
| Current Planning Branch | `planning/os-3.1-mvp-governance` | [Project Status](../PROJECT_STATUS.md) |
| Current Milestone | OS 3.1 MVP governance expansion | [Project Status](../PROJECT_STATUS.md) |
| Current Phase | Documentation governance and AI continuity baseline | [Project Status](../PROJECT_STATUS.md) |
| Current Priority | Keep the planning branch aligned, preserve release discipline, and continue from the next required lifecycle artifact | [Project Status](../PROJECT_STATUS.md) |
| Engineering Baseline | Engineering Standards v1.0 | [Engineering Standards v1.0](../engineering/releases/ENGINEERING_STANDARDS_v1.0/README.md) |
| Product Baseline | MVP 1.0 governance planning with Business OS Phase 1 continuing after BOS-001 release | [MVP 1.0 Alignment](../MVP_1_ALIGNMENT.md) |

---

## Bootstrap Sequence

1. Read [Project Context](../PROJECT_CONTEXT.md).
2. Read [Repository Status](../REPOSITORY_STATUS.md).
3. Read [Next Action](../NEXT_ACTION.md).
4. Read [AI Handover](../AI_HANDOVER.md).
5. Read [AI Bootstrap](AI_BOOTSTRAP.md).
6. Read [Project Status](../PROJECT_STATUS.md).
7. Read [Master Index](../MASTER_INDEX.md).
8. Load only required standards for the current task.
9. Wait for user task.

---

## Runtime Rule

Use this file to start an AI session quickly, then defer to [Project Context](../PROJECT_CONTEXT.md), [Project Status](../PROJECT_STATUS.md), [AI Context Loading](AI_CONTEXT_LOADING.md), and the relevant standards for detailed state, lifecycle, and execution rules.
