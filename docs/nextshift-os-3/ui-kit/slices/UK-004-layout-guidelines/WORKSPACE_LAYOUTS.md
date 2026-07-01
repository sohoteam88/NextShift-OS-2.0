# NextShift UI Kit v1.0

# UK-004 Workspace Layouts

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-004 Layout Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-004 Planning, UK-003 Workspace Components, UK-003 Component Composition Rules  
**Outputs:** Workspace-aware layout patterns  
**Exit Criteria:** Shared Workspace layouts support current and future Business OS surfaces

## Purpose

This document defines reusable Workspace layout patterns for NextShift interfaces.

Workspace layouts define the structural relationship between shell, header, navigation, context, content, actions, and feedback. They do not define runtime context resolution or Workspace persistence.

## Workspace Shell Layout

```text
Workspace Shell
  -> Workspace Header
       -> Workspace identity
       -> Workspace Switcher
       -> Workspace Navigation
       -> Global actions
  -> Content Region
       -> Workspace Context Bar
       -> View-specific content
```

Use this for every authenticated Business OS view.

Rules:

- The shell is shared across Workspaces.
- Navigation is metadata-driven.
- Switching Workspace changes active context, not the shell layout.
- The shell must preserve orientation during loading and empty states.

## Workspace Dashboard Layout

```text
Workspace Dashboard
  -> Context row
  -> Priority widget row
  -> Decision metric grid
  -> Module card grid
  -> AI recommendation panel
```

Use for operational summaries such as Retail Business OS and Recruitment Business OS dashboards.

Rules:

- The most decision-critical widgets appear first.
- KPI Cards and Dashboard Widgets come from UK-003 component guidance.
- AI panels support the dashboard; they do not replace primary metrics.
- Empty states explain missing data and provide a clear next action.

## Workspace Detail Layout

```text
Detail View
  -> Detail header
  -> Summary panel
  -> Main detail section
  -> Supporting panels
  -> Activity or history section
```

Use for a focused entity such as a lead, customer, campaign, member, or module.

Rules:

- Keep entity identity and status visible.
- Put the primary action near the summary.
- Put operational history after current status and next action.
- Use tabs or progressive disclosure only when the detail view becomes too dense.

## Workspace Split View Layout

```text
Split View
  -> Master list / table
  -> Detail panel
```

Use when members need to scan many items and act on one selected item.

Rules:

- The list controls selection.
- The detail panel reflects the selected item.
- The selected state must be visible.
- On smaller viewports, the detail panel may become a separate step, but the selected context must remain clear.

## Workspace Form Layout

```text
Form View
  -> Form header
  -> Required fields
  -> Optional sections
  -> Review / confirmation
  -> Action row
```

Use for creation, editing, onboarding, and configuration tasks.

Rules:

- Required fields appear before optional fields.
- Group fields by decision or object, not database structure.
- The primary action uses outcome language.
- Validation appears close to the affected field or section.

## Workspace Module Layout

```text
Module View
  -> Module header
  -> Module status
  -> Module actions
  -> Module content
  -> Related modules
```

Use for Business Capability modules such as CRM, content, funnel, webinar, or team growth.

Rules:

- The module status communicates readiness, blockers, or next action.
- Related modules appear after the current module's primary content.
- Workspace-specific module labels may differ, but the module layout stays shared.

## Workspace Layout Compatibility

| Layout | Retail | Recruitment | Admin | Future Workspace |
| --- | --- | --- | --- | --- |
| Workspace Shell | Yes | Yes | Yes | Yes |
| Dashboard | Yes | Yes | Yes, when operational | Yes |
| Detail | Yes | Yes | Yes | Yes |
| Split View | Yes | Yes | Yes | Yes |
| Form | Yes | Yes | Yes | Yes |
| Module | Yes | Yes | Conditional | Yes |

## Anti-Fork Rule

Never create layout families named by workspace, such as:

- Retail Dashboard Layout
- Recruitment Detail Layout
- Admin-only Shell Layout

Use shared layout types with workspace-specific content and metadata.
