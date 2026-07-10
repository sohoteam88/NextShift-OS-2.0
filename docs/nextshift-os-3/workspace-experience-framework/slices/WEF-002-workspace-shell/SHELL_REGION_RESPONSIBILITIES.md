# Workspace Experience Framework (WEF) v1.0

# WEF-002 Header, Navigation, and Content Responsibilities

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-002 Workspace Shell  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines responsibilities for the primary Shell regions: Header, Navigation, and Content.

## Header Responsibilities

The Header is responsible for:

- Identifying the active Workspace
- Signaling Workspace state when relevant
- Providing access to Workspace switching when available
- Providing member account and identity controls
- Exposing safe global utilities
- Maintaining orientation during loading, degraded, and switching states

The Header must not:

- Own capability workflows
- Hide the active Workspace identity
- Present actions the member is not allowed to use
- Replace Workspace navigation

## Navigation Responsibilities

Navigation is responsible for:

- Presenting available Workspace surfaces
- Presenting available capability entry points
- Reflecting member permissions
- Preserving navigation hierarchy
- Supporting orientation across surfaces
- Respecting personalization where allowed

Navigation must not:

- Show unavailable capabilities as actionable
- Fork by Business OS type
- Override the active Workspace context
- Replace capability domain workflows

## Content Responsibilities

Content is responsible for:

- Hosting the active Workspace surface
- Receiving active Workspace context
- Respecting Shell state and permissions
- Preserving Shell-level orientation
- Displaying capability or Workspace content inside the Shell frame

Content must not:

- Remove required Shell context
- Render Workspace-dependent actions before context is valid
- Own global Workspace context
- Bypass Shell navigation or state rules

## Responsibility Boundaries

Header orients the member.

Navigation moves the member.

Content hosts the work.

Workspace context governs all three.

## Interaction Rule

When Header, Navigation, and Content disagree, Workspace context and permissions win.
