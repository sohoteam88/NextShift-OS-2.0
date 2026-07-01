# NextShift UI Kit v1.0

# UK-004 Layout Anti-Patterns

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-004 Layout Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-004 Planning, UK-002 Anti-Patterns, UK-003 Component Composition Rules  
**Outputs:** Layout approaches to avoid  
**Exit Criteria:** Anti-patterns protect shared Workspace composition and Design System boundaries

## Purpose

This document identifies layout approaches that should be avoided in NextShift Workspace interfaces.

Anti-patterns are documented to protect consistency, Workspace scalability, Design System boundaries, and AI-assisted design quality.

## Workspace Forking

Anti-pattern:

- Creating a separate layout for each Business OS.
- Examples: `RetailDashboardLayout`, `RecruitmentShell`, `AdminOnlyWorkspaceLayout`.

Why it fails:

- Breaks shared platform composition.
- Increases design and QA duplication.
- Makes future workspaces harder to add.

Preferred approach:

- Use shared layout templates with Workspace-specific metadata and content.

## Action Competition

Anti-pattern:

- Multiple primary actions in one card, panel, or section.

Why it fails:

- Weakens Decision-First UX.
- Makes AI-generated designs inconsistent.
- Increases operational error.

Preferred approach:

- One primary action per unit; use secondary actions only when clearly subordinate.

## Decorative Containment

Anti-pattern:

- Using panels or cards only to create visual boxes.
- Nesting cards inside cards without a real repeated-item or modal relationship.

Why it fails:

- Creates visual noise.
- Makes hierarchy unclear.
- Duplicates Design System layout concerns.

Preferred approach:

- Use Sections for grouping and Cards for repeated or framed items.

## Hidden Context

Anti-pattern:

- Removing Workspace identity, selected item, or active state on smaller layouts.

Why it fails:

- Members lose orientation.
- Actions may appear outside their intended scope.

Preferred approach:

- Preserve context first during responsive reflow.

## Data Before Decision

Anti-pattern:

- Showing raw tables, charts, or history before current status and next action.

Why it fails:

- Forces members to infer priority.
- Conflicts with UK-002 Decision-First UX.

Preferred approach:

- Lead with status, priority signal, and next action; place supporting data below.

## Missing State Regions

Anti-pattern:

- Layouts that define only the populated state.

Why it fails:

- Empty, loading, error, success, and blocked states become inconsistent.
- QA and AI-generated designs have no state reference.

Preferred approach:

- Define state behavior for every layout region that depends on data or action.

## Responsive Reversal

Anti-pattern:

- Reflowing content so secondary details appear before the primary decision on compact viewports.

Why it fails:

- Breaks hierarchy.
- Creates a different product experience by viewport.

Preferred approach:

- Preserve priority order when stacking.

## Runtime Leakage

Anti-pattern:

- Defining API, database, routing, persistence, or RBAC logic in layout guidance.

Why it fails:

- Blurs documentation boundaries.
- Duplicates runtime architecture.

Preferred approach:

- Document visual structure and composition only.

## Component Redesign Through Layout

Anti-pattern:

- Using layout guidance to redefine Button, Card, Table, Chart, Badge, or Workspace components.

Why it fails:

- Duplicates the Design System and UK-003 Component Catalog.

Preferred approach:

- Reference existing components and describe where they belong in the layout.

## Checklist For Review

- Does the layout fork by Workspace name?
- Does the view preserve Workspace context?
- Is there exactly one primary action per unit?
- Are empty/loading/error/success states represented?
- Does responsive reflow preserve hierarchy?
- Are components referenced rather than redesigned?
- Is runtime logic excluded?
