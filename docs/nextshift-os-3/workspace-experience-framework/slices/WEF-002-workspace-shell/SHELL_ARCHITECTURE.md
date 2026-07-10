# Workspace Experience Framework (WEF) v1.0

# WEF-002 Shell Architecture

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-002 Workspace Shell  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the conceptual architecture of the Workspace Shell without prescribing runtime implementation.

## Architecture Model

The Workspace Shell is composed of five conceptual layers:

### 1. Workspace Context Layer

Receives the active Workspace context from the WEF-001 Workspace Model.

Required context includes:

- Active Workspace
- Active member
- Workspace state
- Member role and permissions
- Available capability set
- Personalization state

### 2. Shell Frame Layer

Defines the persistent regions that surround Workspace content.

This includes:

- Header region
- Navigation region
- Content host region
- Context/status region
- Utility/control region

### 3. Navigation Coordination Layer

Coordinates how members move between Workspace surfaces and capability entry points.

This layer references navigation rules but does not replace WEF-003 Workspace Navigation.

### 4. Surface Hosting Layer

Hosts dashboards, lists, forms, flows, reports, and capability surfaces inside the active Workspace context.

### 5. State Presentation Layer

Presents Shell-level state such as loading, degraded, unavailable, switching, empty, and error states.

## Shell Flow

1. Workspace context is resolved.
2. Shell frame is prepared.
3. Workspace identity and state are displayed.
4. Navigation and controls are populated from available context.
5. Primary content surface renders inside the content host.
6. Shell updates state and controls as the member operates.

## Architecture Constraints

- The Shell must not own capability domain logic.
- The Shell must not define database, route, or service contracts.
- The Shell must not bypass WEF-001 context ownership.
- The Shell must not fork by Business OS type.
- The Shell must follow released Design System and UI Kit guidance.

## Architecture Rule

The Shell is the experience frame. The Workspace Model is the context authority. Capabilities are the domain owners. Runtime architecture owns implementation mechanics.
