# NextShift UI Kit v1.0

# UK-003 Component Usage Guidelines

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This document guides how components from the [Component Catalog](COMPONENT_CATALOG.md) should be selected and applied. It converts UK-002 Design Principles into concrete component-selection guidance. It does not redefine component implementation, which is owned by the released Design System (DS-001 through DS-008).

## Component Selection Model

Select a component by answering four questions in order:

1. **What is the member trying to do?** Understand, decide, or act (UK-002 Decision-First UX).
2. **What is the smallest component that does it?** Prefer a Foundation or Content component over a business composition.
3. **Does it carry business or AI meaning?** If yes, use the Business or AI specialization built on the base component.
4. **Is it inside a workspace surface?** If yes, confirm it consumes Workspace Registry metadata rather than hardcoded values.

## Do and Don't

| Do | Don't |
| --- | --- |
| Reuse a released Design System component | Invent a new primitive |
| Name actions by outcome (`Schedule follow-up`) | Use generic labels (`Submit`, `Manage`) |
| Define empty, loading, error, and success states | Ship only the happy path |
| Drive workspace surfaces from registry metadata | Hardcode Retail/Recruitment differences |
| Pair metrics and recommendations with reasons | Present data without operational relevance |
| Keep one primary action per unit | Compete multiple primary actions |
| Communicate state with text and shape | Rely on color alone |

## Guidance By Category

### Foundation

- Use the smallest control that expresses the intent.
- Every interactive control has an accessible name describing the outcome.
- Group related controls with Content components rather than spacing alone.

### Content

- Every remote-data container defines empty, loading, and error states.
- Use Card for grouped units, Section for titled regions, Table for comparison.
- Keep the primary action visible; do not bury it in a menu.

### Navigation

- Navigation moves between surfaces; it never mutates data.
- Derive active state from the current route.
- In workspace surfaces, populate navigation from `getNavigationItems()`.

### Workspace

- One shared shell; differences come from metadata.
- The Workspace Switcher changes business context, not the current view.
- Confirm multi-workspace scalability: the surface must support N workspaces.

### Business

- Pair each metric with why it matters and the next action.
- Prefer a KPI Card over a raw number; prefer a Decision Card over a bare list.

### AI

- Always pair a recommendation with reasoning and confidence.
- Make AI actions reversible or confirmable.
- Show AI system state (idle, working, error) honestly.

### Data Visualization

- Every chart has a title, legend, and empty/error states.
- Provide a non-visual alternative to color and to the chart itself.

## Workspace-Aware Usage

- Confirm the component consumes Workspace Context where relevant.
- Confirm Retail and Recruitment render from the same component via metadata.
- Confirm a new Business OS could be added by configuration, not redesign (UK-002 Enterprise Scalability).

## Principle Cross-Reference

| UK-002 Principle | Usage rule |
| --- | --- |
| AI-First Experience | Use deterministic names and documented prompt phrases |
| Decision-First UX | Lead with decision-relevant information and specific actions |
| Clarity Over Complexity | Direct labels; visible state |
| Consistency | Reuse catalog components and terminology |
| Progressive Disclosure | Reveal advanced controls on demand; never hide risk |
| Enterprise Scalability | Support more data, roles, and workspaces without redesign |
| Accessibility By Default | Design states and names for assistive technology |
| Human And AI Collaboration | State authority boundaries in prompts |
| Trustworthy Interaction | Confirm consequential actions; show feedback |
| Responsive-First Thinking | Preserve hierarchy and primary actions across viewports |

## Related Documents

- [Component Catalog](COMPONENT_CATALOG.md)
- [Component States and Variants](COMPONENT_STATES_AND_VARIANTS.md)
- [Component Composition Rules](COMPONENT_COMPOSITION_RULES.md)
- [QA Component Checklist](QA_COMPONENT_CHECKLIST.md)
