# NextShift UI Kit v1.0

# UK-003 Component States and Variants

**Project:** NextShift UI Kit v1.0  
**Slice:** UK-003 Component Catalog  
**Status:** Implemented

## Purpose

This document defines the shared vocabulary of states and variants used across the [Component Catalog](COMPONENT_CATALOG.md). Defining states and variants once keeps catalog entries consistent and deterministic for Claude Design, Figma, and QA. Implementation of these states is owned by DS-002 Component Library and DS-005 Interaction System.

## State Vocabulary

### Interactive States

| State | Meaning | Required for |
| --- | --- | --- |
| default | Resting state | All interactive components |
| hover | Pointer over target | Pointer-driven interactive components |
| focus | Keyboard/AT focus | All interactive components |
| active | Being pressed/engaged | Buttons, items |
| disabled | Not currently available | Where an action can be unavailable |
| loading | Work in progress | Async actions and containers |
| selected | Chosen within a set | Selectable items, tabs, switcher options |

### Content States

| State | Meaning | Required for |
| --- | --- | --- |
| empty | No data yet | Any remote-data container |
| loading | Data being fetched | Any remote-data container |
| error | Load or action failed, with recovery | Any remote-data container / action |
| success | Action completed | Consequential actions |

## State Rules

- Every component that renders remote data must define empty, loading, and error states. The happy path alone is incomplete (UK-002 Trustworthy Interaction).
- Error states pair a plain-language message with a recovery path (for example `Retry import`).
- State must be communicated by text and shape, never by color alone (UK-002 Accessibility By Default; DS-007).
- Focus state is always present and visible; it follows visual order.
- Loading state preserves member orientation; it does not remove context without explanation.

## Variant Vocabulary

Variants are approved axes of variation. Components declare which axes apply.

| Axis | Values | Applies to |
| --- | --- | --- |
| emphasis | primary, secondary, ghost, destructive | Actions |
| size | sm, md, lg | Most interactive components |
| tone | neutral, info, success, warning, danger | Badges, indicators, states |
| density | comfortable, compact | Lists, tables, dashboards |
| interactivity | static, interactive | Cards, list items |

## Variant Rules

- Exactly one primary emphasis per unit of composition.
- `destructive` emphasis always pairs with confirmation and clear recovery (UK-002 Trustworthy Interaction).
- Tone carries semantic meaning and must also be expressed in text or icon, not color alone.
- Density is a display choice; it must not remove required information or the primary action.
- Do not invent new variant axes; propose them through a future UI Kit slice.

## State and Variant Matrix (anchor components)

| Component | Emphasis | Size | Content states |
| --- | --- | --- | --- |
| Button | primary/secondary/ghost/destructive | sm/md/lg | — |
| Input | — | md | error |
| Card | static/interactive | — | empty/loading |
| Table | — | comfortable/compact | empty/loading/error |
| KPI Card | with/without action | — | empty/loading/error |
| AI Recommendation Panel | — | — | empty/loading/error/accepted/dismissed |
| Chart Container | — | — | empty/loading/error |
| Workspace Switcher | — | — | active option / disabled / hidden(single) |

## AI and Figma Alignment

- State and variant names are the exact tokens used in [AI Component Prompts](AI_COMPONENT_PROMPTS.md) and [Figma Component Naming](FIGMA_COMPONENT_NAMING.md).
- Figma variant properties use these axis names (`type`, `size`, `state`, `tone`, `density`).

## Related Documents

- [Component Catalog](COMPONENT_CATALOG.md)
- [Component Composition Rules](COMPONENT_COMPOSITION_RULES.md)
- [QA Component Checklist](QA_COMPONENT_CHECKLIST.md)
