# Workspace Experience Framework (WEF) v1.0

# WEF-001 Context Management

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-001 Workspace Model  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines how Workspace context is managed across the active Workspace experience.

## Context Managed by the Workspace

The active Workspace context includes:

- Active Workspace identifier
- Workspace name
- Workspace type
- Workspace state
- Active member
- Member role
- Member permissions
- Available capability set
- Active navigation model
- Active surface
- Session state
- Personalization state

## Context Resolution

Workspace context must be resolved before a member performs Workspace-dependent actions.

Resolution sequence:

1. Resolve authenticated member.
2. Resolve available Workspaces.
3. Select or restore active Workspace.
4. Resolve Workspace membership.
5. Resolve permissions.
6. Resolve available capabilities.
7. Restore valid personalization and session state.
8. Activate Workspace shell and navigation.

## Context Persistence

Workspace context may persist:

- Active Workspace preference
- Last valid landing surface
- Saved views
- Saved filters
- Display preferences
- Navigation preferences

Persisted context must be revalidated before reuse.

## Context Safety

The system must discard context when:

- The member no longer has access.
- The Workspace is suspended or archived.
- A saved surface no longer exists.
- A saved capability is no longer available.
- Permissions no longer allow the intended action.

## Context Handoff to Capabilities

Capabilities receive Workspace context as an input. They must not become the source of global context.

Every capability surface inside a Workspace must know:

- Active Workspace
- Active member
- Relevant permissions
- Capability availability
- Current Workspace state

## Context Rule

No Workspace-dependent surface should render as actionable until active Workspace context is known and valid.
