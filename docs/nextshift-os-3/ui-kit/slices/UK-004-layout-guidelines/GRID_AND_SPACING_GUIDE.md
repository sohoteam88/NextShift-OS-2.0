# NextShift UI Kit v1.0

# UK-004 Grid and Spacing Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-004 Layout Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-004 Planning, UK-003 Component Composition Rules, Design System v1.0  
**Outputs:** Grid and spacing design guidance  
**Exit Criteria:** Grid and spacing guidance supports layout consistency without redefining tokens

## Purpose

This document defines design guidance for grid and spacing decisions in NextShift Workspace layouts.

It does not define token values, CSS classes, or implementation breakpoints. The Design System remains the implementation authority for spacing tokens, layout primitives, and responsive behavior.

## Grid Principles

| Principle | Rule |
| --- | --- |
| Content drives grid | Choose grid structure based on scanning and comparison needs. |
| Priority drives order | Higher-priority content appears first when grids reflow. |
| Components stay intact | Cards, widgets, tables, and panels keep their internal anatomy. |
| Density is intentional | Dense layouts support repeated work; spacious layouts support first-run or guided work. |
| Grids are shared | Do not create workspace-specific grid systems. |

## Common Grid Patterns

### Single Column

Use for:

- Compact viewports
- Forms
- Guided workflows
- Narrow detail views
- Content that must be read in sequence

Rule: Single-column order must match the information hierarchy.

### Two Region

Use for:

- Detail plus supporting panel
- List plus selected detail
- Form plus helper/summary panel

Rule: The left/top region owns the primary task; the right/bottom region supports it.

### Card Grid

Use for:

- Workspace Module Cards
- KPI Cards
- Repeated summary Cards

Rule: Card grids order by priority and reflow without changing component meaning.

### Dashboard Grid

Use for:

- KPI rows
- Widget grids
- Chart and comparison regions

Rule: The dashboard grid starts with decision-critical signals and moves broad exploration lower.

## Spacing Guidance

| Spacing relationship | Guidance |
| --- | --- |
| Between regions | Use enough separation to communicate a change in purpose. |
| Within a section | Keep related content visually grouped. |
| Between repeated cards | Keep scan rhythm consistent. |
| Between label and control | Keep labels visually attached. |
| Between error and field | Keep feedback close to the affected input. |
| Around primary action | Keep the action visually connected to the decision or form it completes. |

Spacing is semantic: it communicates grouping, priority, and relationship.

## Density Guidance

### Compact Operational Density

Use for:

- Admin tables
- CRM lists
- Repeated operational workflows
- Dashboards used daily

Guidance:

- Keep row/card rhythm tight.
- Preserve readable labels.
- Avoid decorative space.
- Keep state and action visible.

### Standard Workspace Density

Use for:

- Workspace dashboards
- Module views
- Detail views

Guidance:

- Balance scanning and explanation.
- Use section spacing to separate decisions.
- Keep supporting detail secondary.

### Spacious Guidance Density

Use for:

- First-run setup
- Empty states
- Onboarding
- Success states

Guidance:

- Use extra space to reduce intimidation.
- Keep the next action prominent.
- Avoid marketing-style composition inside operational tools.

## Grid and Spacing Anti-Patterns

- Using cards only to create margins.
- Nesting cards inside cards for visual decoration.
- Letting grid order differ from decision priority.
- Creating separate Retail or Recruitment grid systems.
- Hiding required state feedback because the grid is crowded.
- Using spacing inconsistently between equivalent sections.

## Relationship To Design System

The Design System owns:

- Spacing token values.
- Layout primitives.
- Responsive implementation.
- Component dimensions.

UK-004 owns:

- Layout intent.
- Region relationships.
- Grid selection guidance.
- Spacing semantics.
