# Workspace Experience Framework (WEF) v1.0

# WEF-005 Switching Rules

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-005 Workspace Switching  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the required rules for Workspace Switching behavior.

## Core Rules

### One Active Workspace

Only one Workspace may be active at a time.

### Explicit Target

Every switch must resolve a specific target Workspace before activation.

### Permission Check

The member must be eligible to enter the target Workspace before switching completes.

### Context Revalidation

Persisted or cached target context must be revalidated before use.

### Shell Update

The Workspace Shell must update identity, state, and global controls after activation.

### Navigation Update

Workspace Navigation must update entries, active state, permission visibility, and orientation after activation.

### Capability Safety

Capability surfaces must not continue source Workspace actions after the target Workspace is active.

### Recovery Required

Failed switching must provide safe recovery.

## Disallowed Behavior

Workspace Switching must not:

- Activate two Workspaces at once
- Hide the target Workspace identity
- Bypass platform authorization
- Transfer unsafe source actions to the target Workspace
- Reuse stale target permissions
- Fork switching behavior by Business OS type
- Let a capability perform global Workspace switching

## Rule Priority

When switching convenience conflicts with context safety, context safety wins.
