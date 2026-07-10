# NextShift UI Kit v1.0

# UK-003 Component Composition Rules

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This document defines how catalog components combine into larger surfaces. It governs nesting, hierarchy, and allowed and forbidden compositions. Layout implementation is owned by DS-003 Layout System and DS-004 Dashboard Framework; this document defines design intent, not CSS.

## Composition Hierarchy

```text
Workspace Shell
  -> Workspace Header (identity, switcher, navigation)
  -> Content Region
       -> Section
            -> Card / Table / List
                 -> Business or AI composition
                      -> Foundation controls + Data Visualization
```

Composition flows from the shell inward. A component may contain components below it in this hierarchy and must not contain components above it.

## Core Composition Rules

1. **One primary action per unit.** A card, panel, or section exposes a single primary action; others are secondary.
2. **Business and AI components are compositions.** They are built from Foundation, Content, and Data Visualization components; they never introduce new primitives.
3. **Workspace surfaces are metadata-driven.** Navigation, widgets, module cards, and action groups are populated from Workspace Registry metadata, not hardcoded per workspace.
4. **States compose too.** A container's empty, loading, and error states apply to its children; a Card in a loading Table does not fetch independently.
5. **Depth is bounded.** Avoid nesting interactive containers inside interactive containers (for example an interactive Card containing another interactive Card) to keep focus unambiguous.
6. **Priority order is preserved.** When surfaces reflow responsively, the most decision-relevant unit stays first (UK-002 Decision-First UX, Responsive-First Thinking).

## Allowed Compositions

- Section containing Cards.
- Card containing a Metric Block, Trend Indicator, and a single Button.
- Dashboard containing KPI Cards, Chart Containers, and Workspace Module Cards.
- AI Recommendation Panel containing a Reasoning Summary, Confidence Indicator, and an action group.
- Table containing row-level Foundation actions and status Badges.
- Workspace Header containing a Workspace Switcher and Topbar Items.

## Forbidden Compositions

- A workspace-specific shell, navigation, or dashboard fork (for example `RetailShell`, `RecruitmentDashboard`).
- A cloned page per workspace.
- Two competing primary actions in one unit.
- Interactive Card nested directly inside another interactive Card.
- A Business or AI component that redefines a Design System token or primitive.
- A chart or table without empty and error states.

## Workspace Composition

- The Workspace Shell hosts exactly one active workspace at a time.
- Retail and Recruitment are the same composition rendered with different metadata.
- Adding a Business OS is a composition-and-configuration change, never a new page tree (UK-002 Enterprise Scalability).
- The Workspace Switcher changes the active business context; Navigation changes the current view. These are distinct and must not be merged.

## Dashboard Composition Pattern

```text
Dashboard
  -> Workspace Context Bar
  -> KPI Card row (decision metrics, priority order)
  -> Chart Container / Comparison Panel
  -> Workspace Module Card grid
  -> AI Recommendation Panel
```

The pattern is shared; the specific metrics, modules, and AI guidance are resolved from workspace metadata.

## Related Documents

- [Component Catalog](COMPONENT_CATALOG.md)
- [Workspace Components](WORKSPACE_COMPONENTS.md)
- [Component States and Variants](COMPONENT_STATES_AND_VARIANTS.md)
- [Component Usage Guidelines](COMPONENT_USAGE_GUIDELINES.md)
