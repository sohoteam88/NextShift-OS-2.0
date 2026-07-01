# Workspace Experience Framework (WEF) v1.0

# WEF-004 Context Propagation

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-004 Workspace Context  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines how Workspace Context is propagated across WEF layers and capability surfaces.

## Propagation Targets

Workspace Context propagates to:

- Workspace Shell
- Workspace Navigation
- Active surface
- Capability entry points
- Capability surfaces
- Workspace switching flows
- Personalization surfaces
- Audit and QA review surfaces

## Propagation Rules

### Shell Propagation

The Shell receives Workspace identity, Workspace state, member identity, member role, and safe global controls.

### Navigation Propagation

Navigation receives active Workspace, permissions, capability availability, active surface, and orientation state.

### Surface Propagation

Surfaces receive the context required to render safely inside the active Workspace.

### Capability Propagation

Capabilities receive Workspace Context as an input and must not become the source of global Workspace Context.

### Preference Propagation

Preferences may shape view defaults or saved states only after permissions and capability availability are valid.

## Propagation Safety

Workspace Context propagation must:

- Preserve active Workspace identity.
- Preserve permission boundaries.
- Avoid leaking context across Workspaces.
- Avoid presenting stale capabilities as available.
- Avoid mixing member preferences across incompatible Workspaces.
- Preserve Shell and Navigation orientation.

## Stale Context Handling

When propagated context becomes stale:

- Affected surfaces must refresh or disable unsafe actions.
- The member must receive clear state feedback when relevant.
- The platform must not continue using stale context for Workspace-dependent actions.

## Propagation Rule

Context may be shared across WEF layers, but ownership remains governed by WEF-001: Workspace owns global context, capabilities consume it, and runtime enforcement remains platform-owned.
