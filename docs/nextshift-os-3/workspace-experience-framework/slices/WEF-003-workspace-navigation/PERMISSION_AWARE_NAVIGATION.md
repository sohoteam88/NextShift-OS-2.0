# Workspace Experience Framework (WEF) v1.0

# WEF-003 Permission-Aware Navigation

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-003 Workspace Navigation  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines how Workspace Navigation reflects member permissions.

## Permission Sources

Navigation must respect:

- Member identity
- Workspace membership
- Workspace role
- Permission grants
- Workspace state
- Capability availability
- Capability-specific permission requirements

## Permission Behavior

### Visible and Actionable

An entry may be visible and actionable when the member has permission and the target capability or surface is available.

### Visible but Disabled

An entry may be visible but disabled when awareness is useful but action is not permitted or not currently available.

### Hidden

An entry may be hidden when the member should not know about or does not need access to the target area.

### Redirected or Replaced

An entry may be replaced by an onboarding, setup, or access request surface when the Workspace requires a safe alternative.

## Permission Rules

- Navigation must not grant access.
- Navigation must reflect access.
- Runtime authorization remains authoritative.
- Permission state must be resolved before rendering actionable entries.
- Restricted entries must never be the only way to recover member orientation.

## Capability Permission Boundaries

Capabilities may define permission requirements for their own surfaces. Workspace Navigation consumes those requirements when assembling navigation.

Capabilities must not:

- Own global Workspace navigation
- Override Shell navigation rules
- Bypass Workspace state
- Present domain actions as global navigation

## Admin and Configuration Entries

Admin and configuration entries must be visible only when:

- The active member has the required role or permission
- The Workspace state allows configuration
- The entry is relevant to the active Workspace

## Permission Rule

Navigation should never be treated as a security boundary. It is an experience representation of permissions enforced elsewhere by the platform.
