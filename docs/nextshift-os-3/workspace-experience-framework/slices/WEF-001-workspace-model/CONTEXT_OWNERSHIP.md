# Workspace Experience Framework (WEF) v1.0

# WEF-001 Context Ownership

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-001 Workspace Model  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines what context belongs to the Workspace model and what context remains owned by other parts of the platform.

## Workspace-Owned Experience Context

WEF owns the product meaning of:

- Active Workspace
- Workspace type
- Workspace state
- Workspace membership role
- Workspace-visible capability set
- Workspace navigation context
- Workspace shell context
- Workspace switching context
- Workspace preference context

## Platform-Owned Context

The platform owns:

- Authentication state
- Member identity
- Tenant or organization relationships
- Permission enforcement
- Runtime session handling
- Data access enforcement

## Capability-Owned Context

Business capabilities own:

- Domain objects
- Domain state
- Use cases
- Business rules
- Capability-specific workflows
- Capability-specific events

## Design-Owned Context

The Design System and UI Kit own:

- Component implementation authority
- Design token authority
- Visual and interaction guidance
- Accessibility guidance
- AI design prompt guidance

## Ownership Rules

- Workspace context may reference capability context but must not redefine it.
- Capability surfaces must consume Workspace context when rendered inside a Workspace.
- Workspace preferences may influence presentation but not domain truth.
- Permission enforcement remains a platform responsibility.
- WEF documents experience ownership, not storage ownership.

## Conflict Resolution

When context ownership is unclear:

1. If it affects authentication, authorization, or data access, it belongs to platform architecture.
2. If it affects domain behavior, it belongs to the relevant capability.
3. If it affects visual implementation, it belongs to the Design System.
4. If it affects design language or AI generation guidance, it belongs to the UI Kit.
5. If it affects how a member understands, enters, switches, or operates within a Business OS context, it belongs to WEF.
