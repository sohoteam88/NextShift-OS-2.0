# Workspace Experience Framework (WEF) v1.0

# WEF-001 User Responsibilities

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-001 Workspace Model  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines member and user responsibilities inside the Workspace model.

## Member Responsibilities

Members are responsible for:

- Selecting the correct Workspace when multiple Workspaces are available
- Understanding the active Workspace context before acting
- Using available capabilities according to their role and permissions
- Maintaining personal preferences that improve their own workflow
- Recognizing when a Workspace is degraded, suspended, or archived
- Avoiding actions in the wrong Workspace context

## Admin Responsibilities

Workspace administrators are responsible for:

- Assigning member access according to platform policy
- Maintaining Workspace readiness
- Reviewing available capabilities for the Workspace
- Monitoring Workspace-level configuration and preference impact
- Ensuring Workspace naming and identity are clear to members

## Operator Responsibilities

Platform or business operators are responsible for:

- Confirming Workspace setup before release
- Coordinating Workspace lifecycle transitions
- Communicating degraded, suspended, or archived states
- Ensuring Workspace behavior remains aligned with WEF documentation

## Responsibility Boundaries

Members do not own:

- Platform permission enforcement
- Runtime session resolution
- Capability domain logic
- System-generated state
- Shared UI implementation

Admins do not own:

- Design System redesign
- UI Kit redesign
- Runtime architecture redesign
- Capability behavior outside approved configuration

## Experience Rule

The Workspace experience must make user responsibilities clear through labels, state messaging, navigation context, and action availability.
