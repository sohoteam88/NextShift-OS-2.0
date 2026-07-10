# UK-001 Information Language

## Purpose

This document standardizes the terms used to describe NextShift product surfaces, UI structures, workflows, and states.

Use these terms consistently across UI Kit documentation, product briefs, Claude Design prompts, QA checklists, and future business capability documentation.

## Standard Terms

| Term | Definition | Usage Guidance |
| --- | --- | --- |
| Workspace | A business operating area where users perform ongoing work. | Use for durable areas such as CRM, Analytics, Revenue, Campaign, or Decision Brain. |
| Dashboard | An operational summary interface for monitoring status, progress, risk, and priority. | Use when the primary goal is scanning and comparison. |
| Module | A bounded functional area inside a workspace. | Use for grouped capability areas such as lead management or campaign scheduling. |
| View | A complete screen or route-level surface. | Use when describing what the user sees as a whole. |
| Section | A logical grouping of related content within a view. | Use for unframed page regions or bands. |
| Panel | A contained operational area for focused controls or data. | Use for dashboard or workspace regions that hold related functions. |
| Card | A repeated or framed item used for comparison, summary, or compact detail. | Avoid using card to describe every surface. |
| Widget | A reusable dashboard unit that communicates a single operational signal. | Use inside dashboards for KPI, chart, status, or alert units. |
| Flow | A multi-step user journey with a start, progression, and completion state. | Use for onboarding, setup, creation, conversion, or execution journeys. |
| Pattern | A reusable user experience solution. | Use for repeated interaction or layout solutions. |
| Variant | A documented variation of a component, pattern, or state. | Use for size, emphasis, tone, density, or behavior differences. |
| Context | The operational situation that changes what content or action is relevant. | Use to describe tenant, role, capability, state, or workflow conditions. |
| Action | A user-triggered operation that changes state, navigation, or workflow progress. | Use for buttons, commands, menu items, or workflow steps. |
| State | The current condition of data, UI, workflow, or system feedback. | Use for loading, empty, error, success, selected, disabled, overdue, or active conditions. |

## Naming Rules

- Use singular nouns for reusable concepts: `Workspace`, `Pattern`, `Panel`.
- Use business-domain nouns for capability-specific surfaces: `Customer Workspace`, `Revenue Dashboard`.
- Use action verbs for commands: `Create`, `Convert`, `Archive`, `Retry`.
- Use state adjectives only when they change user interpretation: `Pending`, `Overdue`, `Blocked`, `Completed`.
- Do not introduce synonyms when an approved term exists.

## Approved Structure Names

Preferred:

- Workspace
- Dashboard
- View
- Section
- Panel
- Card
- Widget
- Flow
- Pattern

Avoid:

- Pagelet
- Box
- Tile, unless referring to a fixed-format grid item
- Blob
- Container, unless referring to a technical layout primitive
- Screen, when `View` is more precise

## State Language

Use state terms consistently:

| State | Meaning |
| --- | --- |
| Loading | Data or UI is not ready yet. |
| Empty | No user-relevant data exists for the current context. |
| Error | The requested operation failed. |
| Success | The requested operation completed. |
| Warning | User attention is required before risk increases. |
| Critical | Immediate attention is required. |
| Disabled | The action or control is not currently available. |
| Selected | The item is currently chosen or active. |
| Expanded | Additional information is visible. |
| Collapsed | Additional information is hidden. |

## Action Language

Use direct action labels:

- Create customer
- Convert lead
- Schedule follow-up
- Review insight
- Start campaign
- Export report

Avoid vague labels:

- Continue, unless the next step is obvious
- Submit, unless submitting a form is the actual user goal
- Manage, unless the surface contains multiple management actions
- Learn more, inside operational workflows

## Cross-Reference Rules

When referencing another artifact:

- Reference the owning document by exact title.
- State whether it is implementation authority, language authority, or workflow authority.
- Do not duplicate details owned by another document.

Example:

`NextShift Design System v1.0 is the implementation authority for component behavior. This UI Kit document defines usage language only.`
