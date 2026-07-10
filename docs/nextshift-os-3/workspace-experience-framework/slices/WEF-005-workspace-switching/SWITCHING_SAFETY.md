# Workspace Experience Framework (WEF) v1.0

# WEF-005 Switching Safety

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-005 Workspace Switching  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines safety requirements for Workspace Switching.

## Safety Risks

Switching must account for:

- Unsaved work
- Pending mutations
- Incomplete forms
- Active approvals
- In-progress AI actions
- Stale permissions
- Degraded Workspace state
- Suspended or archived target Workspace
- Capability unavailability
- Cross-Workspace data leakage

## Safety Behaviors

### Preserve or Discard Explicitly

State must be preserved, discarded, or blocked with clear rules. Silent loss of critical work is not valid.

### Fail Closed

If target Workspace Context cannot be resolved, target actions must remain unavailable.

### Prevent Leakage

Source Workspace data, actions, filters, and permissions must not leak into the target Workspace.

### Recheck Permissions

Permissions must be checked against the target Workspace before activation.

### Signal Risk

The member should receive clear feedback when switching affects unsaved work, degraded state, or unavailable capabilities.

## Safety States

Switching may enter:

- Safe to switch
- Confirmation required
- Blocked by unsaved work
- Blocked by permissions
- Blocked by target state
- Failed with recovery

## Safety Rule

Workspace Switching must prefer a slower safe transition over a faster ambiguous transition.
