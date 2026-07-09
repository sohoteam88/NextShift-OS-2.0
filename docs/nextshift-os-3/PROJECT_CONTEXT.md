# Project Context

Version: 1.0

Status: Current

Last Updated: 2026-07-09

---

## Purpose

This document is the single source of truth for loading current NextShift OS project context.

It routes humans and AI assistants to the current repository state, next action, handover notes, and context integrity record without replacing detailed planning, status, release, audit, or engineering standards documents.

---

## Project Identity

| Field | Current State |
| --- | --- |
| Project | NextShift OS |
| Repository | `sohoteam88/NextShift-OS-2.0` |
| Current Branch | `planning/os-3.3-runtime-platform` |
| Current Context Package | OS 3.3 Runtime Platform context package |
| Context Authority | This document |
| Production Baseline | OS 3.1 RC1 production baseline remains governed by [Project Status](PROJECT_STATUS.md) |

---

## Context Loading Order

Start every project continuation with:

1. [Project Context](PROJECT_CONTEXT.md)
2. [Repository Status](REPOSITORY_STATUS.md)
3. [Next Action](NEXT_ACTION.md)
4. [AI Handover](AI_HANDOVER.md)
5. [Context Checksum](CONTEXT_CHECKSUM.md)

Then load only task-relevant supporting records:

- [Project Status](PROJECT_STATUS.md)
- [Master Index](MASTER_INDEX.md)
- [Workflow Status](WORKFLOW_STATUS.md)
- [Workflow Releases](WORKFLOW_RELEASES.md)
- [Capability Status](CAPABILITY_STATUS.md)
- [Release Tags](capabilities/RELEASE_TAGS.md)
- [AI Bootstrap](ai/AI_BOOTSTRAP.md)

---

## Current Operating Context

| Area | Current State | Canonical Source |
| --- | --- | --- |
| Repository synchronization | RM-001 metadata synchronization and audit complete | [Workflow Status](WORKFLOW_STATUS.md) |
| Workflow baseline | WF-001 through WF-007 released and audited | [Workflow Releases](WORKFLOW_RELEASES.md) |
| Capability baseline | CAP-001 frozen; CAP-002, CAP-003, and CAP-004 released; CAP-005 in implementation | [Capability Status](CAPABILITY_STATUS.md) |
| Developer platform release | OS 3.2 Developer Platform records remain historical; current planning branch is OS 3.3 Runtime Platform | [OS 3.2 Developer Platform Release](releases/OS_3_2_DEVELOPER_PLATFORM/README.md) |
| Repository status | Current branch and working tree state captured separately | [Repository Status](REPOSITORY_STATUS.md) |
| Immediate next action | Maintained separately to avoid stale conversation context | [Next Action](NEXT_ACTION.md) |
| AI continuation | Maintained separately for handoff between sessions | [AI Handover](AI_HANDOVER.md) |

---

## Maintenance Rule

Update this context package whenever any of the following changes:

- Current branch
- Current lifecycle phase
- Current next action
- Repository synchronization state
- Workflow release state
- Capability release state
- AI handover instructions

After updating any context package file, update [Context Checksum](CONTEXT_CHECKSUM.md).
