# Workspace Experience Framework (WEF) v1.0

# WEF-004 Context Architecture

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-004 Workspace Context  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the conceptual architecture for Workspace Context without prescribing runtime implementation.

## Architecture Layers

### Identity Resolution Layer

Resolves the active member and their platform identity.

### Workspace Resolution Layer

Resolves the active Workspace, Workspace type, Workspace state, and Workspace membership.

### Permission Resolution Layer

Resolves member role and permission grants for the active Workspace.

### Capability Resolution Layer

Resolves which capabilities and surfaces are available in the active Workspace.

### Shell Context Layer

Provides context needed by the Workspace Shell, including identity, state, utility controls, and Shell-safe status information.

### Navigation Context Layer

Provides context needed by Workspace Navigation, including available entries, active location, restricted entries, and orientation state.

### Surface Context Layer

Provides context consumed by the active Workspace surface or capability surface.

### Preference Context Layer

Provides valid Workspace and member preferences that may shape view defaults, saved surfaces, or display behavior.

## Context Assembly Flow

1. Resolve member identity.
2. Resolve available Workspaces.
3. Select or restore the active Workspace.
4. Resolve Workspace membership.
5. Resolve permissions.
6. Resolve available capability set.
7. Resolve Shell and Navigation context.
8. Resolve valid surface and preference context.
9. Mark Workspace Context ready.

## Architecture Constraints

- Context architecture must not define database schema.
- Context architecture must not define API shape.
- Context architecture must not define authorization implementation.
- Context architecture must not bypass platform permission enforcement.
- Context architecture must not let capabilities own global Workspace Context.

## Architecture Rule

Workspace Context is assembled from platform, Workspace, permission, capability, Shell, Navigation, surface, and preference signals. It is consumed by experience layers but enforced by platform runtime where enforcement is required.
