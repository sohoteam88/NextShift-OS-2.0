# NextShift UI Kit v1.0

# UK-006 Accessible Component Usage

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-006 Accessibility Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-006 Planning, UK-003 Component Catalog, UK-003 Component States and Variants, UK-005 Interaction Patterns  
**Outputs:** Accessible usage guidance for existing Design System components  
**Exit Criteria:** Component usage guidance references existing components without redesigning implementation

## Purpose

This document defines how existing NextShift components should be used accessibly in UI Kit documentation, design briefs, Figma planning, QA review, and AI-assisted design generation.

It does not redesign components or define implementation contracts. The Design System owns component implementation.

## Component Usage Rules

| Rule | Guidance |
| --- | --- |
| Use existing components | Reference UK-003 and the Design System instead of inventing new accessible primitives. |
| Preserve state vocabulary | Use default, hover, focus, active, disabled, loading, selected, empty, error, and success consistently. |
| Pair visual and semantic meaning | Tone, color, icon, and layout emphasis should be paired with text or structure. |
| Keep action labels specific | Buttons, menu items, and links should describe the outcome. |
| Avoid nested interactivity | Interactive containers inside interactive containers create ambiguous focus and reading order. |

## Foundation Controls

Guidance:

- Buttons should have outcome-based labels.
- Destructive buttons require confirmation and recovery guidance where available.
- Inputs should have visible labels and nearby validation guidance.
- Menus should not hide the only primary action unless the flow explicitly requires it.
- Toggles and switches should make current state and scope clear.

## Content Components

Guidance:

- Cards should expose a clear title, state, and action when interactive.
- Panels should group related content, not act as decorative containers.
- Empty states should include explanation and next action where available.
- Badges and indicators should not rely on color alone.
- Status labels should use stable language across Workspaces.

## Data Components

Guidance:

- Tables should preserve row identity, selection state, sorting, filtering, and recovery paths.
- KPI Cards should explain the metric and current state.
- Chart Containers should include a decision-oriented summary expectation.
- Filtered empty states should distinguish no matches from no data.
- Bulk actions should become available only when selection is valid.

## Workspace Components

Guidance:

- Workspace Switcher must communicate the active Workspace.
- Workspace navigation must show active destination.
- Workspace Header should preserve identity, context, and global actions.
- Workspace Module Cards should communicate module purpose, state, and available action.
- Workspace-specific labels may change by metadata, but accessibility expectations remain shared.

## AI Components

Guidance:

- AI Recommendation Panel should include recommendation, reason, confidence or uncertainty, and member actions.
- AI Insight Card should make the insight type and consequence clear.
- Reasoning Summary should be concise by default with deeper detail behind disclosure when useful.
- Confidence Indicator should not rely on color alone.
- Accepted, dismissed, low-confidence, loading, and error states should be documented.

## Component State Matrix

| State | Accessibility Expectation |
| --- | --- |
| focus | Visible and aligned with task order. |
| disabled | Reason is available when not obvious. |
| loading | Affected region and preserved context are clear. |
| selected | Selection remains clear after sort, filter, or reflow. |
| expanded/collapsed | Disclosure state and relationship are understandable. |
| error | Problem, affected object, and recovery are clear. |
| success | Material completion is confirmed. |

## Composition Guidance

- One primary action per card, panel, section, or view region.
- Interactive cards should not contain nested interactive cards.
- Feedback should remain near the affected component or region.
- Responsive reflow should preserve labels, state, and action access.
- Component usage should not define token values, CSS, ARIA, or runtime behavior.

## AI Design Prompt Template

```text
Use existing NextShift Design System components.
Component:
Workspace context:
Accessible name expectation:
Required states:
Keyboard expectation:
Screen reader expectation:
Color-independent communication:
Feedback and recovery:
Do not redefine component implementation.
```

## Non-Goals

- No component implementation.
- No component redesign.
- No Storybook updates.
- No design token changes.
- No ARIA attribute definitions.

## Status

Implemented.
