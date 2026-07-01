# Workspace Experience Framework (WEF) v1.0

# WEF-004 Context Model

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-004 Workspace Context  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the canonical Workspace Context model for every NextShift Business OS.

## Definition

Workspace Context is the resolved set of information that tells the platform, Shell, Navigation, and capability surfaces which Workspace is active, who is operating inside it, what state it is in, and what capabilities are available.

Workspace Context is not a database schema, route contract, or capability domain model. It is an experience contract that describes the minimum context required for safe Workspace operation.

## Core Context Elements

Workspace Context includes:

- Active Workspace identity
- Workspace type
- Workspace state
- Active member
- Member role
- Permission grants
- Available capability set
- Active Shell state
- Active navigation state
- Active surface context
- Workspace preferences
- Degraded, loading, error, or switching state

## Context Consumers

Workspace Context is consumed by:

- Workspace Shell
- Workspace Navigation
- Capability surfaces
- Workspace switching flows
- Workspace personalization
- QA and audit workflows
- Future Business OS implementations

## Context Non-Responsibilities

Workspace Context does not:

- Enforce permissions by itself
- Own capability domain data
- Define persistence mechanics
- Define runtime routes
- Define UI component implementation
- Replace WEF-001 ownership rules
- Replace WEF-002 Shell structure
- Replace WEF-003 Navigation rules

## Canonical Rule

No Workspace-dependent surface should become actionable until active Workspace Context is known, current, and valid.
