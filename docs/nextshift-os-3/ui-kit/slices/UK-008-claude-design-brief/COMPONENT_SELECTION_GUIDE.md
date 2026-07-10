# NextShift UI Kit v1.0

# UK-008 Component Selection Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-008 Claude Design Brief  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-008 Planning, UK-003 Component Catalog, UK-003 AI Component Prompts, UK-006 Accessible Component Usage  
**Outputs:** Component selection guidance for AI-generated design artifacts  
**Exit Criteria:** Component selection reuses released components without inventing new primitives

## Purpose

This document defines how Claude Design should choose components for NextShift UI artifacts.

Component selection describes which existing component family should be used and why. It does not define component implementation, variants beyond UK-003, code, CSS, Storybook stories, or tokens.

## Component Selection Sequence

Choose components in this order:

1. Identify member goal: understand, decide, or act.
2. Identify surface type: Dashboard, Detail, Split View, Form, Workflow, Settings, Panel, Card, Widget, or Module.
3. Identify required state: loading, empty, error, success, disabled, selected, expanded, warning, or blocked.
4. Choose the smallest existing component that communicates the need.
5. Compose Business, Workspace, AI, or Data Visualization components only when base components are insufficient.
6. Confirm accessibility, interaction, and theme constraints.

## Component Category Rules

| Category | Use When | AI Prompt Requirement |
| --- | --- | --- |
| Foundation | A basic control or input is needed. | Label by outcome and include focus/disabled/error states where applicable. |
| Content | Information needs grouping or summary. | Use Sections, Panels, Cards, Tables, or Lists without decorative nesting. |
| Navigation | Members move between views or sections. | Keep Workspace switching distinct from navigation. |
| Workspace | Workspace identity, switcher, modules, or shell context is needed. | Use metadata-driven Workspace differences. |
| Business | Metrics, decisions, or operational signals are needed. | Pair signal with reason and next action. |
| AI | Recommendation, summary, insight, draft, or confidence is needed. | Include reason, confidence or uncertainty, and member actions. |
| Data Visualization | Trends, comparisons, or distributions are needed. | Include title, legend, text alternative, and empty/loading/error states. |

## State Requirements

Claude Design should include:

- default state for all components.
- focus state for interactive components.
- disabled state where action availability can change.
- loading, empty, and error states for data-dependent components.
- success state for material completion.
- selected state for tabs, lists, tables, switchers, and options.
- accepted and dismissed states for AI recommendations where applicable.

## Component Prompt Template

```text
Component category:
Component name:
Purpose:
Workspace context:
Required states:
Primary action:
Accessibility requirement:
Interaction requirement:
Theme or brand constraint:
Do not invent a new component or redefine implementation.
```

## Anti-Invention Rules

- If no exact component exists, describe the needed pattern as a future proposal, not an implemented component.
- Do not create new primitive names.
- Do not define implementation props, CSS classes, or token names.
- Do not replace component guidance with visual description alone.

## Non-Goals

- No component implementation.
- No Storybook implementation.
- No component API specification.
- No CSS or token guidance.
- No design-system expansion.

## Status

Implemented.
