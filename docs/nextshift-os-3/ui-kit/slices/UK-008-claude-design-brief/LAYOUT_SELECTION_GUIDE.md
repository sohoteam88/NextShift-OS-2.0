# NextShift UI Kit v1.0

# UK-008 Layout Selection Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-008 Claude Design Brief  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-008 Planning, UK-004 Layout Guidelines, UK-004 Page Templates, UK-004 Responsive Layout Guide  
**Outputs:** Layout selection guidance for AI-generated design artifacts  
**Exit Criteria:** Layout selection preserves hierarchy, Workspace context, responsive behavior, and Design System boundaries

## Purpose

This document defines how Claude Design should choose NextShift layout templates.

Layout selection describes design structure and hierarchy. It does not define CSS grids, breakpoints, routes, page components, or runtime behavior.

## Layout Selection Model

Choose the layout by task:

| User Need | Layout Template |
| --- | --- |
| Monitor operational status | Dashboard Template |
| Inspect one entity or record | Detail Template |
| Scan many items and act on one | Split View Template |
| Create, edit, or configure information | Form Template |
| Complete an ordered process | Workflow Template |
| Configure preferences or controls | Settings Template |
| Focus on a bounded capability | Module Layout |

## Prompt Requirements

Claude Design prompts should state:

```text
Layout template:
Workspace context:
Primary decision:
Primary action:
Required regions:
Supporting regions:
Responsive priority:
Required states:
Anti-patterns to avoid:
```

## Region Priority

AI-generated layouts should order regions as:

1. Workspace context.
2. View purpose.
3. Current state.
4. Primary decision.
5. Primary action.
6. Supporting evidence.
7. Secondary detail.
8. Feedback or recovery.

This follows UK-004 information hierarchy.

## Responsive Rules

- Preserve Workspace identity.
- Preserve primary action access.
- Preserve selected, disabled, loading, empty, error, and success states.
- Stack by decision priority.
- Do not move secondary detail above the primary decision.
- Do not create separate mobile-only page structures.

## AI Layout Output Requirements

Generated layout artifacts should include:

- Template name.
- Region list.
- Component composition by region.
- State behavior by region.
- Responsive priority.
- Accessibility notes.
- Theme and branding notes.
- Anti-patterns.

## Layout Anti-Patterns

Reject outputs that:

- Fork layouts by Workspace type.
- Put data before current decision.
- Hide primary action on compact layouts.
- Nest cards inside cards for decoration.
- Remove feedback regions.
- Define CSS, breakpoints, or route implementation.

## Non-Goals

- No route map.
- No CSS grid or breakpoint values.
- No runtime layout implementation.
- No component styling.
- No workspace-specific shell implementation.

## Status

Implemented.
