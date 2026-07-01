# NextShift UI Kit v1.0

# UK-004 Page Templates

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-004 Layout Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-004 Planning, UK-003 Component Catalog, UK-002 Design Principles  
**Outputs:** Reusable page template guidance  
**Exit Criteria:** Page templates are implementation-independent and Workspace-aware

## Purpose

This document defines reusable page templates for NextShift Workspace surfaces.

Templates describe view composition, not routes, framework code, or runtime behavior.

## Template Selection Guide

| Template | Use When | Primary Components |
| --- | --- | --- |
| Dashboard Template | The view summarizes operational status and next actions. | KPI Card, Chart Container, Workspace Module Card, AI Recommendation Panel |
| Detail Template | The view focuses on one entity or record. | Section, Card, Table, Badge, Activity Feed |
| Split View Template | The view requires scanning a set and acting on one item. | Table/List, Detail Panel, Action Group |
| Form Template | The view creates, edits, or configures information. | Input, Select, Checkbox, Section, Button |
| Workflow Template | The view guides a multi-step process. | Step sections, Status Badge, Action Group, Empty/Success/Error State |
| Settings Template | The view configures preferences or controls. | Section, Switch, Select, Form controls |

## Dashboard Template

```text
Dashboard View
  -> Workspace Context Bar
  -> Priority summary row
  -> KPI / widget grid
  -> Supporting chart or comparison region
  -> Workspace module grid
  -> AI recommendation region
```

Requirements:

- The first row answers "what needs attention now?"
- Metrics are paired with labels and states.
- Widgets have loading, empty, and error states.
- AI recommendations are secondary to the operational summary.

## Detail Template

```text
Detail View
  -> Entity header
  -> Summary card
  -> Primary detail section
  -> Supporting information section
  -> Activity / history region
```

Requirements:

- Entity name, status, and primary action appear near the top.
- Supporting information does not precede the current state.
- Activity history appears after current operational context.

## Split View Template

```text
Split View
  -> List / table region
  -> Selected item detail region
  -> Detail actions
```

Requirements:

- Selection is explicit.
- Empty selection state tells the member what to choose.
- Detail actions are scoped to the selected item.
- Responsive behavior preserves selected context.

## Form Template

```text
Form View
  -> Form header
  -> Required section
  -> Optional section
  -> Review / validation section
  -> Action row
```

Requirements:

- Required fields are first.
- Fields are grouped by user decision, not backend model.
- Validation appears in context.
- The final action label describes the outcome.

## Workflow Template

```text
Workflow View
  -> Workflow context
  -> Current step
  -> Supporting guidance
  -> Step actions
  -> Completion or blocker state
```

Requirements:

- The current step is visually and textually clear.
- Previous and next steps are secondary.
- Blockers include recovery guidance.
- Completion confirms the result and offers the next relevant action.

## Settings Template

```text
Settings View
  -> Settings group
  -> Setting row / control
  -> Helper text or effect description
  -> Save / revert action where needed
```

Requirements:

- Group settings by intent.
- Make consequences clear.
- Use Switch only for immediate binary settings.
- Use explicit save/revert where changes are staged.

## Workspace Template Rules

- Templates are shared across Workspace types.
- Workspace-specific labels, modules, widgets, and actions come from metadata or content.
- Template structure should not depend on Retail, Recruitment, Admin, or future Workspace names.
- Every template must define loading, empty, error, and success behavior when data or actions are involved.
