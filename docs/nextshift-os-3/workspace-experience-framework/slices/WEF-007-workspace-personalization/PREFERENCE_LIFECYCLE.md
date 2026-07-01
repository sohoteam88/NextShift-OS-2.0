# Workspace Experience Framework (WEF) v1.0

# WEF-007 Preference Lifecycle

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-007 Workspace Personalization  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the lifecycle of Workspace personalization preferences.

## Lifecycle Principle

Preferences must be created, applied, suspended, reset, and retired in ways that preserve Workspace safety and member orientation.

## Preference Lifecycle Stages

### 1. Defaulted

The Workspace uses platform, Business OS, Workspace, or role defaults before member-specific preferences exist.

### 2. Captured

A valid preference is recorded from explicit member choice, Workspace configuration, role configuration, or approved system behavior.

### 3. Validated

The preference is checked against permissions, Workspace Context, lifecycle state, Design System rules, UI Kit rules, and Business OS configuration.

### 4. Applied

The preference changes an allowed presentation default or remembered safe state.

### 5. Remembered

The preference persists as a reusable default inside its valid scope.

### 6. Revalidated

The preference is rechecked when Workspace Context, permissions, lifecycle state, Business OS configuration, or Workspace identity changes.

### 7. Suspended

The preference is temporarily ignored because the Workspace state, member permissions, target Workspace, or safety condition makes it invalid.

### 8. Reset

The preference is cleared or replaced when it is stale, unsafe, conflicting, or no longer supported.

### 9. Retired

The preference is no longer used because the Workspace, surface, role, Business OS configuration, or lifecycle state no longer supports it.

## Lifecycle Rules

- Preferences must be validated before application.
- Preferences must be revalidated after Workspace Switching.
- Preferences must be revalidated after Workspace Context changes.
- Preferences must be suspended when lifecycle state makes them unsafe.
- Preferences must not hide recovery, degraded, suspended, archived, or removed states.
- Preference reset must return to a safe default.
- Retired preferences must not continue affecting Shell, Navigation, or capability surfaces.

## Conflict Handling

When preferences conflict:

1. Platform safety wins.
2. Workspace Lifecycle state wins.
3. Workspace Context and permissions win.
4. Business OS configuration wins.
5. Workspace-level preferences win over member-level preferences.
6. Explicit member preference wins over remembered local state.

## Switching Relationship

During Workspace Switching, source Workspace preferences must not leak into target Workspace operation unless they are valid for the target Workspace and are revalidated against its context and lifecycle state.

## Lifecycle Rule

Personalization preferences are never permanently authoritative. They remain valid only while their scope, context, permissions, and lifecycle state remain valid.
