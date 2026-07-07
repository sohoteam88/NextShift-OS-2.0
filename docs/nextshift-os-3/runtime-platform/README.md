# Runtime Platform v1.0

Version: 1.0

Status: In Progress

Last Updated: 2026-07-07

---

## Purpose

Runtime Platform v1.0 is the first OS 3.3 project.

It establishes the reusable runtime layer for future NextShift capabilities, automations, plugins, AI agents, workspace sessions, and production deployment layers.

---

## Scope

Runtime Platform v1.0 provides stable contracts for:

- Runtime kernel lifecycle
- Workspace runtime execution
- Session runtime state
- Context runtime propagation
- Capability runtime registration
- Event runtime dispatch
- Permission-aware runtime boundaries

---

## Non-Goals

Runtime Platform v1.0 does not implement:

- UI components
- Full automation engine
- AI agent orchestration
- Plugin SDK loading
- Deployment infrastructure
- Business-specific workflows

---

## Current Slice

| Slice | Status | Documentation |
| --- | --- | --- |
| RP-001 Runtime Kernel Foundation | Ready for Release | [RP-001](slices/RP-001-runtime-kernel-foundation/README.md) |
| RP-002 Context Runtime | Ready for Release | [RP-002](slices/RP-002-context-runtime/README.md) |
| RP-003 Session Runtime | Released | [RP-003](slices/RP-003-session-runtime/README.md) |
| RP-004 Workspace Runtime | Released | [RP-004](slices/RP-004-workspace-runtime/README.md) |
| RP-005 Capability Runtime | Released | [RP-005](slices/RP-005-capability-runtime/README.md) |
| RP-006 Event Runtime | Released | [RP-006](slices/RP-006-event-runtime/README.md) |
| RP-007 Permission / Diagnostics Runtime | Released | [RP-007](slices/RP-007-permission-diagnostics-runtime/README.md) |
| RP-008 Runtime Platform Consolidation | Not started | Pending Stop B |

---

## Package

Runtime Platform source is implemented in:

```text
packages/runtime/
```

Public package name:

```text
@nextshift/runtime
```

---

## Validation

RP-001 through RP-007 validation:

```bash
pnpm --filter @nextshift/runtime test
pnpm --filter @nextshift/runtime typecheck
pnpm type-check
```

Required runtime and root validation commands passed through RP-007.

---

## Lifecycle Rule

Perform Git Release Checkpoint for RP-007, then continue to RP-008 Runtime Platform Consolidation.
