# NextShift UI Kit v1.0

# UK-004 Layout Guidelines

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-004 Layout Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-004 Planning, UK-004 Documentation Implementation Contract, STD-001 through STD-004, UK-001, UK-002, UK-003  
**Outputs:** Layout guidance for Workspace-aware NextShift surfaces  
**Exit Criteria:** Layout rules are Workspace-aware, implementation-independent, and ready for Verification

## Purpose

This document defines the official layout guidance for NextShift Workspace interfaces.

Layout guidance describes how views, sections, panels, cards, widgets, navigation regions, and actions should be arranged. It does not define CSS, React, Vue, runtime routing, tokens, or Design System implementation details.

## Layout Principles

| Principle | Rule |
| --- | --- |
| Workspace first | Every layout begins by identifying the active Workspace context. |
| Decision first | The most decision-relevant content appears before supporting detail. |
| Stable regions | Header, navigation, content, and action regions remain predictable across views. |
| Progressive disclosure | Advanced detail appears after the primary decision path. |
| Responsive continuity | Responsive changes preserve hierarchy, state, and action access. |
| Shared composition | Retail, Recruitment, Admin, and future workspaces reuse the same layout model. |

## Standard Layout Regions

Every full Workspace view should define these regions where applicable:

1. Workspace header: identity, current context, navigation, switcher, and global actions.
2. Context region: current view title, status, filters, scope, or route context.
3. Primary content region: decision-critical content and the main task path.
4. Supporting content region: secondary panels, details, history, or related modules.
5. Action region: primary action plus secondary actions.
6. Feedback region: loading, empty, error, success, or AI status states.

Not every view needs every region, but every visible region must have a clear purpose.

## Workspace Layout Model

```text
Workspace Shell
  -> Workspace Header
  -> Workspace Context Region
  -> View Content
       -> Primary Section
       -> Supporting Section
       -> Detail / Action Panel
  -> Feedback State
```

This structure is shared across Business OS experiences. Workspace metadata may change labels, navigation, widgets, templates, and priorities, but it must not require a layout fork.

## Page Composition Rules

1. Start with the task or decision the view supports.
2. Put identity and context before content.
3. Put the primary action near the decision it completes.
4. Keep repeated items in Cards, Lists, Tables, or Widgets from UK-003.
5. Keep business metrics in KPI Cards, Metric Blocks, or Chart Containers from UK-003.
6. Keep AI recommendations in AI Recommendation Panels or AI Insight Cards from UK-003.
7. Use Sections for logical grouping, not decoration.
8. Avoid nested framed regions unless a component contract requires containment.

## Layout Density

| Density | Use For | Guidance |
| --- | --- | --- |
| Compact | Operational dashboards, admin lists, data-heavy views | Reduce vertical explanation, preserve labels and states. |
| Standard | Workspace dashboards, detail views, mixed content | Balance scanning and action clarity. |
| Spacious | Onboarding, empty states, first-run setup | Use more guidance, but keep the next action clear. |

Density is a layout choice, not a token definition. Implementation spacing remains owned by the Design System.

## Workspace-Aware Guidance

- Retail and Recruitment layouts must remain structurally shared.
- Workspace-specific differences appear through content, navigation, widgets, and capability metadata.
- A future Business OS should fit the same Workspace Shell, Dashboard, Detail, Split View, and Form layout types.
- Workspace switching must not reposition the global shell unpredictably.
- Workspace identity should stay visible when a member is operating in a Workspace-specific view.

## Relationship To Earlier UI Kit Slices

- UK-001 provides approved terms such as Workspace, View, Section, Panel, Card, Widget, and Layout.
- UK-002 provides decision-first, responsive-first, consistency, and progressive disclosure rules.
- UK-003 provides the components used inside layout regions.

## Non-Goals

- No runtime routing rules.
- No CSS, grid implementation, breakpoints in code, or token definitions.
- No new Design System components.
- No workspace-specific page forks.
- No business workflow definitions.
