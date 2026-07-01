# NextShift UI Kit v1.0

# UK-008 Context Loading Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-008 Claude Design Brief  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-008 Planning, UK-001 AI Design Language, UK-002 Design Principles, UK-003 through UK-007  
**Outputs:** Context loading guidance for Claude Design and future AI Design Agents  
**Exit Criteria:** AI design context can be loaded consistently without duplicating Design System or UI Kit content

## Purpose

This document defines what context Claude Design should load before generating a NextShift UI artifact.

Context loading means selecting the correct authoritative sources and constraints before writing a prompt or producing an output. It does not mean loading runtime data, database records, code, or external systems.

## Loading Order

Load context in this order:

1. Design authority: NextShift Design System v1.0.
2. Language authority: NextShift UI Kit v1.0.
3. Terminology: UK-001.
4. Principles: UK-002.
5. Components: UK-003.
6. Layout: UK-004.
7. Interaction: UK-005.
8. Accessibility: UK-006.
9. Theme and branding: UK-007.
10. Business or Workspace source, when applicable.

## Minimum Context Packet

Every design task should include:

```text
Authority:
Surface type:
Workspace:
Member goal:
Business state:
Data state:
Required components:
Required layout:
Required interactions:
Accessibility constraints:
Theme and branding constraints:
Output artifact:
Non-goals:
```

## Surface Context

Choose one primary surface type:

- Workspace
- Dashboard
- View
- Flow
- Pattern
- Panel
- Card
- Widget
- Module

Do not use generic terms such as screen, pagelet, box, thing, or manage.

## Workspace Context

Workspace context must identify:

- Active Workspace.
- Workspace type.
- Workspace-scoped actions.
- Workspace navigation or switcher expectations.
- Metadata-driven differences.
- Anti-fork rule.

Retail and Recruitment differences should be content and metadata differences, not separate design systems.

## State Context

Document relevant states:

- default
- hover
- focus
- active
- disabled
- loading
- empty
- error
- success
- warning
- selected
- expanded
- collapsed
- blocked
- accepted
- dismissed
- low-confidence

Only include states that apply, but never prompt only for the happy path when data or async action is involved.

## Constraint Context

Every context packet must include:

- Do not redefine tokens.
- Do not invent components.
- Do not create Workspace-specific forks.
- Do not define runtime behavior.
- Do not rely on color alone.
- Do not create new theme or brand systems.
- Do not generate implementation code unless a later software slice explicitly requests it.

## Incomplete Context Handling

If the input lacks key context, Claude Design should:

- State the missing context.
- Use the safest shared Workspace assumptions.
- Avoid inventing business rules.
- Avoid inventing components or visual systems.
- Produce a constrained design brief rather than implementation detail.

## Non-Goals

- No runtime data loading.
- No code inspection requirements.
- No business workflow ownership.
- No implementation task execution.
- No external research requirement.

## Status

Implemented.
