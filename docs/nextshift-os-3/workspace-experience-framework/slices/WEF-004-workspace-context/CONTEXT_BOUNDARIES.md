# Workspace Experience Framework (WEF) v1.0

# WEF-004 Context Boundaries

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-004 Workspace Context  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines boundaries for Workspace Context ownership, consumption, and enforcement.

## WEF-004 Owns

WEF-004 owns the experience contract for:

- Workspace Context meaning
- Context lifecycle
- Context propagation
- Context boundaries
- Context consistency expectations
- Context governance

## Platform Runtime Owns

Platform runtime owns:

- Authentication
- Authorization enforcement
- Session mechanics
- Persistence
- API behavior
- Route behavior
- Data access enforcement

## WEF-001 Owns

WEF-001 owns the canonical Workspace model, including global context ownership rules.

## WEF-002 Owns

WEF-002 owns Shell regions and Shell responsibilities that consume Workspace Context.

## WEF-003 Owns

WEF-003 owns Navigation behavior and hierarchy that consume Workspace Context.

## Capabilities Own

Capabilities own:

- Domain objects
- Domain workflows
- Domain validation
- Domain events
- Capability-specific state

## Boundary Rules

- Workspace Context must not redefine domain objects.
- Workspace Context must not replace platform permission enforcement.
- Workspace Context must not define runtime storage.
- Workspace Context must not fork by Business OS type.
- Capabilities may consume context but must not own global context.
- Shell and Navigation may present context but must not enforce it as the only security boundary.

## Boundary Rule

If context determines where the member is operating, it belongs to WEF. If it determines what the member may legally or technically access, enforcement belongs to platform runtime.
