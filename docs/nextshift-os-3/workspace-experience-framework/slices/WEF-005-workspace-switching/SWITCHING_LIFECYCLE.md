# Workspace Experience Framework (WEF) v1.0

# WEF-005 Switching Lifecycle

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-005 Workspace Switching  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the lifecycle of a Workspace Switching operation.

## Lifecycle Stages

### 1. Idle

The member is operating inside one active Workspace.

### 2. Discovering Targets

Available target Workspaces are being shown or resolved.

### 3. Selecting Target

The member or system identifies the target Workspace.

### 4. Validating Eligibility

The platform confirms membership, permissions, Workspace state, and target availability.

### 5. Checking Safety

The platform checks unsaved work, pending actions, stale context, degraded states, and cross-Workspace risk.

### 6. Resolving Target Context

The target Workspace Context is resolved but is not yet actionable.

### 7. Activating Target

The target Workspace becomes active. Shell, Navigation, and surfaces update.

### 8. Completed

The member is safely operating in the target Workspace.

### 9. Canceled

The switch is stopped before target activation. The current Workspace remains active.

### 10. Failed

The switch cannot complete. The member is returned to a safe recovery state.

## Lifecycle Rules

- The source Workspace remains active until the target is safely activated.
- Target actions must not become available during partial context resolution.
- Canceled switching must preserve the source Workspace.
- Failed switching must not leave the member between Workspaces.
- Completion must clear unsafe source Workspace action context.

## Lifecycle Rule

Workspace Switching must have explicit start, safety, activation, and recovery states. Silent switching is not valid when context or permissions change.
