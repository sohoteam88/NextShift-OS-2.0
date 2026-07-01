# Workspace Experience Framework (WEF) v1.0

# WEF-006 Lifecycle Model

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-006 Workspace Lifecycle  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the canonical Workspace Lifecycle model for every NextShift Workspace.

## Lifecycle Definition

Workspace Lifecycle is the platform-level experience contract that governs how a Workspace is created, made available, activated, operated, suspended, recovered, retired, and removed from member use.

The lifecycle defines Workspace state. It does not define Business Capability behavior, runtime implementation, database schema, route structure, or UI component implementation.

## Canonical Lifecycle Rule

A Workspace must always be in one clear lifecycle state. Member-facing experiences, Shell state, Navigation availability, Workspace Context, and Workspace Switching must reflect that state.

## Lifecycle States

| State | Meaning |
| --- | --- |
| Planned | Workspace is defined but not yet provisioned for use. |
| Provisioning | Workspace resources and configuration are being prepared. |
| Active | Workspace is available for normal member operation. |
| Degraded | Workspace is available with reduced reliability or capability. |
| Suspended | Workspace access is temporarily paused. |
| Recovering | Workspace is being restored after failure, interruption, or unsafe state. |
| Archived | Workspace is preserved for history but not available for normal operation. |
| Removed | Workspace is no longer available as an operating context. |

## State Ownership

Workspace Lifecycle state is owned by the platform Workspace layer.

Capabilities may react to lifecycle state, but they must not define their own competing Workspace lifecycle. Business OS configuration may constrain the experience of a lifecycle state, but it must not fork the platform lifecycle model.

## Relationship to Prior WEF Slices

- WEF-001 defines the Workspace as the operating unit.
- WEF-002 defines how the Shell reflects Workspace availability.
- WEF-003 defines how Navigation responds to available Workspace surfaces.
- WEF-004 defines how Workspace Context is resolved and propagated.
- WEF-005 defines how switching respects source and target Workspace state.

## Model Boundary

WEF-006 defines lifecycle semantics and governance. It does not define:

- Runtime lifecycle services
- Database lifecycle columns
- API lifecycle endpoints
- Authorization implementation
- UI component variants
- Business OS-specific lifecycle forks

## Lifecycle Model Requirement

Every Workspace lifecycle state must have a clear meaning, allowed transitions, recovery behavior, and governance expectation before it is exposed to members.
