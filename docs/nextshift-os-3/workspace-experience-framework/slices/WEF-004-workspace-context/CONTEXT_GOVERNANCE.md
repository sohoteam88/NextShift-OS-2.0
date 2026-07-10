# Workspace Experience Framework (WEF) v1.0

# WEF-004 Context Governance

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-004 Workspace Context  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines governance rules for Workspace Context changes.

## Governed Decisions

Context governance applies when a project proposes to:

- Add a new Workspace Context element
- Change the meaning of an existing context element
- Change how context is propagated
- Change when context is considered valid
- Change stale or invalid context behavior
- Change how capabilities consume Workspace Context
- Change how Shell or Navigation displays Workspace Context

## Required Review Questions

Every context change must answer:

- Which WEF slice owns this context behavior?
- Is the context global, Shell-specific, Navigation-specific, surface-specific, or capability-specific?
- Who consumes the context?
- Who enforces the context?
- Can the context become stale?
- What happens when context is missing or invalid?
- Does the change preserve WEF-001 ownership rules?
- Does the change preserve WEF-002 Shell responsibilities?
- Does the change preserve WEF-003 Navigation rules?
- Does the change introduce runtime implementation details?

## Consistency Rules

Workspace Context must be:

- Explicit
- Current
- Permission-aware
- Workspace-scoped
- Consistent across Shell, Navigation, and surfaces
- Revalidated before unsafe use
- Clear to members when it affects action

## Anti-Patterns

Avoid:

- Hidden Workspace Context
- Cross-Workspace context leakage
- Capability-owned global context
- Stale context driving actions
- Context treated as a security boundary without runtime enforcement
- Business OS-specific context forks
- UI labels that imply a different active Workspace than runtime context

## Governance Rule

Workspace Context changes must preserve member safety, platform boundaries, and cross-Workspace consistency before they optimize convenience.
