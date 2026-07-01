# Workspace Experience Framework (WEF) v1.0

# WEF-003 Navigation Hierarchy

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-003 Workspace Navigation  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines the standard hierarchy for Workspace Navigation.

## Hierarchy Levels

### Level 1: Workspace Entry

The top-level Workspace entry identifies the active Workspace and provides entry into the Workspace operating experience.

Examples:

- Workspace Home
- Workspace Dashboard
- Workspace Overview

### Level 2: Capability Group

Capability groups organize related capability entry points.

Examples:

- Customers
- Campaigns
- Revenue
- Content
- Settings

Capability group names must follow approved product terminology and may vary by available capability set.

### Level 3: Capability Entry Point

Capability entry points open a specific capability surface.

Examples:

- Customer List
- Lead Pipeline
- Campaign Planner
- Revenue Targets

### Level 4: Surface State

Surface state represents the active view, saved view, filter, tab, or local mode inside a capability or Workspace surface.

Surface state may appear in breadcrumbs, tabs, contextual controls, or saved view selectors.

### Level 5: Action Context

Action context represents the immediate operation being performed.

Examples:

- Create
- Edit
- Review
- Approve
- Export

Action context must not replace navigation hierarchy.

## Hierarchy Rules

- Workspace identity must remain visible or recoverable.
- Capability groups must not hide permission boundaries.
- Capability entry points must not appear actionable when unavailable.
- Surface state must not masquerade as a new Workspace.
- Actions must not become permanent navigation entries unless approved as surfaces.

## Ordering Rules

Navigation ordering should prioritize:

1. Workspace orientation
2. Primary operating surfaces
3. Active capability areas
4. Saved or personalized entries
5. Configuration and admin entries
6. Secondary utilities

## Hierarchy Rule

Members should always understand where they are, what Workspace they are operating in, what capability they are using, and what action context they are entering.
