# Workspace Experience Framework (WEF) v1.0

# WEF-005 Switching Governance

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-005 Workspace Switching  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines governance for Workspace Switching changes.

## Governed Decisions

Switching governance applies when a project proposes to:

- Add a Workspace switcher entry point
- Change switching confirmation behavior
- Change target Workspace eligibility
- Change how unsaved work is handled
- Change target context resolution
- Change switching recovery behavior
- Add automatic or suggested switching
- Change how capabilities react to switching

## Required Review Questions

Every switching change must answer:

- What source Workspace is active?
- What target Workspace is selected?
- Who is allowed to enter the target?
- What context is preserved?
- What context is discarded?
- What safety risks exist?
- What happens if target context fails to resolve?
- Does the change preserve WEF-001 ownership rules?
- Does the change preserve WEF-002 Shell responsibilities?
- Does the change preserve WEF-003 Navigation rules?
- Does the change preserve WEF-004 Context rules?

## Approval Rules

Switching changes are valid when:

- They preserve one active Workspace.
- They revalidate target context.
- They respect permissions.
- They prevent cross-Workspace leakage.
- They do not introduce Business OS-specific switching forks.
- They remain documentation-aligned with WEF-001 through WEF-004.

## Anti-Patterns

Avoid:

- Silent switching
- Partial activation
- Source and target ambiguity
- Capability-owned global switching
- Stale permissions after switching
- Unsaved work loss without warning
- Business OS-specific switching behavior

## Governance Rule

Workspace Switching is a platform-level experience contract. It may be configured by Workspace context, but its safety and lifecycle rules remain WEF-owned.
