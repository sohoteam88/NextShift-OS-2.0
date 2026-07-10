# Workspace Experience Framework (WEF) v1.0

# WEF-004 Context Lifecycle

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-004 Workspace Context  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the lifecycle of Workspace Context.

## Lifecycle Stages

### 1. Unresolved

Workspace Context is not yet known.

Required behavior:

- Workspace-dependent surfaces must not be actionable.
- Shell and Navigation may show loading or selection states.

### 2. Resolving

The platform is determining active member, Workspace, permissions, capabilities, and preferences.

Required behavior:

- Partial context must not be treated as complete.
- Unsafe actions must remain disabled.

### 3. Ready

Workspace Context is valid and complete enough for normal Workspace operation.

Required behavior:

- Shell, Navigation, and content surfaces may render actionable controls according to permissions.

### 4. Updating

Workspace Context is changing because of role changes, Workspace switching, state changes, preference changes, or capability availability changes.

Required behavior:

- Affected surfaces must refresh, disable, or reorient safely.

### 5. Degraded

Workspace Context is available but some signal is incomplete, stale, or limited.

Required behavior:

- Member orientation must be preserved.
- Affected actions must be clearly limited.

### 6. Invalid

Workspace Context is no longer valid.

Required behavior:

- Workspace-dependent actions must fail closed.
- The member must be routed to a safe recovery, selection, or error state.

### 7. Cleared

Workspace Context has ended because the member exited, switched, signed out, or no longer has access.

Required behavior:

- Active Workspace state must no longer be used for actions.

## Lifecycle Transitions

- Unresolved may move to Resolving.
- Resolving may move to Ready, Degraded, or Invalid.
- Ready may move to Updating, Degraded, Invalid, or Cleared.
- Updating may move to Ready, Degraded, Invalid, or Cleared.
- Degraded may move to Ready, Updating, Invalid, or Cleared.
- Invalid may move to Resolving or Cleared after safe recovery.
- Cleared may move to Resolving only through a new selection or restoration flow.

## Lifecycle Rule

Workspace Context must be treated as perishable. Every reuse of persisted or cached context must be revalidated before it drives member-visible action.
