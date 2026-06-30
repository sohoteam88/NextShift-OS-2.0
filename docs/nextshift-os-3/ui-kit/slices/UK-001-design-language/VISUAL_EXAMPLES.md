# UK-001 Supporting Visual Examples

## Purpose

These examples show how the Design Language should describe future interface composition without redefining Design System implementation details.

## Example 1: Operational Dashboard

```text
View:
Revenue Dashboard

Purpose:
Help an operator understand progress, risk, and next action.

Structure:
- Summary section
- KPI widget row
- Forecast panel
- Risk panel
- Recent activity section

Primary action:
Review revenue risk

States:
- Loading: preserve dashboard structure while data loads.
- Empty: explain that no revenue targets exist and offer "Create target".
- Warning: highlight at-risk progress with clear action.
```

Conceptual layout:

```text
+--------------------------------------------------+
| Revenue Dashboard                                |
| Progress summary and current operating period    |
+----------------+----------------+----------------+
| KPI Widget     | KPI Widget     | KPI Widget     |
+----------------+----------------+----------------+
| Forecast Panel                  | Risk Panel      |
|                                 |                 |
+---------------------------------+----------------+
| Recent Activity                                   |
+--------------------------------------------------+
```

## Example 2: Workspace Detail View

```text
View:
Customer Detail View

Purpose:
Help an operator understand one customer and act on next steps.

Structure:
- Header with customer identity and status
- Summary panel
- Timeline section
- Follow-up panel
- Related opportunities section

Primary action:
Schedule follow-up
```

Conceptual layout:

```text
+--------------------------------------------------+
| Customer Name                         Status      |
+-----------------------------+--------------------+
| Summary Panel               | Follow-Up Panel    |
|                             |                    |
+-----------------------------+--------------------+
| Timeline Section                                 |
+--------------------------------------------------+
| Related Opportunities                            |
+--------------------------------------------------+
```

## Example 3: Empty State

```text
Context:
No customers exist yet.

Use:
Explain the empty condition and provide one primary setup action.

Recommended text:
"No customers yet. Create or import customers to begin tracking relationships."

Primary action:
Create customer

Secondary action:
Import customers

Avoid:
Decorative empty states without a clear next action.
```

## Example 4: Progressive Disclosure

```text
Context:
A filter panel includes common filters and advanced segmentation.

Use:
Show common filters by default. Place advanced segmentation behind disclosure.

Avoid:
Hiding required filters or primary workflow controls.
```

## Example 5: AI Design Prompt

```text
Create a NextShift Dashboard view for CRM customer health.

Use:
- Design authority: NextShift Design System v1.0
- Language authority: NextShift UI Kit v1.0
- Surface: Dashboard
- User goal: identify customers needing attention
- Context: CRM workspace, active customer portfolio
- Required structure: summary section, KPI widgets, risk panel, follow-up panel, recent activity
- Required states: loading, empty, warning, error
- Constraints: Do not redesign tokens, components, layout engine, accessibility implementation, theme implementation, runtime, routing, or backend APIs.

Output:
Claude Design-ready layout brief.
```
