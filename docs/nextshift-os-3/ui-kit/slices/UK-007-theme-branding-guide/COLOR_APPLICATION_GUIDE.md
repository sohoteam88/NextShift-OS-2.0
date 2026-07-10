# NextShift UI Kit v1.0

# UK-007 Color Application Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-007 Theme & Branding Guide  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-007 Planning, UK-003 Component States and Variants, UK-005 Feedback Patterns, UK-006 Accessibility Guidelines, NextShift Design System v1.0  
**Outputs:** Color and tone usage guidance without token redefinition  
**Exit Criteria:** Color application guidance preserves state meaning, accessibility, and Design System authority

## Purpose

This document defines how color and tone should be described in NextShift UI Kit artifacts.

It does not define color values, palettes, contrast ratios, CSS variables, token names, or theme implementation.

## Color Authority

The Design System owns:

- Token values.
- Theme palettes.
- Semantic color implementation.
- Light and dark mode rendering.
- Component-level color behavior.

The UI Kit owns:

- Usage intent.
- State meaning.
- Brand and Workspace application guidance.
- Anti-patterns.
- AI prompt constraints.

## Semantic Color Model

Use color to support meaning already expressed through text, structure, icon, or component state.

| Usage | Guidance |
| --- | --- |
| Neutral | Default product surfaces and content hierarchy. |
| Info | Contextual guidance or system information. |
| Success | Completed action or positive state. |
| Warning | Risk, attention, or reversible concern. |
| Danger | Destructive action, failed state, or critical risk. |
| Brand accent | Orientation, identity, or emphasis where approved. |
| Workspace accent | Active Workspace orientation without replacing state meaning. |

Do not introduce new tone categories in UK-007.

## State Color Rules

- Error state must include text and recovery, not color alone.
- Success state must identify the completed outcome when material.
- Warning state must explain the risk or required attention.
- Disabled state must not depend on faded color alone when the reason matters.
- Selected state must remain clear after filtering, sorting, or responsive reflow.
- AI confidence or uncertainty must use text or structure in addition to color.

## Brand Color Rules

- Brand accent can support identity or hierarchy.
- Brand accent should not replace semantic state colors.
- Workspace accent should not override error, warning, success, disabled, or selected state meaning.
- A Workspace color variation must not imply a separate Design System.
- Business-specific color should be metadata-driven where applicable.

## Color In Layouts

- Use color to support hierarchy, not to create decorative containers.
- Do not rely on colored sections to solve unclear information architecture.
- Dense dashboards should prioritize metric meaning and state over branded color.
- Compact layouts should preserve text labels and state meaning when color space is reduced.

## Accessibility Requirements

- Do not communicate state by color alone.
- Preserve contrast intent and leave exact values to the Design System.
- Provide non-color cues for validation, risk, tone, selection, and AI confidence.
- Avoid decorative color that reduces legibility or distracts from primary action.

## AI Design Prompt Template

```text
Color usage intent:
Semantic tone:
Brand or Workspace accent:
State that must be communicated:
Non-color communication:
Accessibility constraints:
Do not define color values, token names, palettes, gradients, or CSS.
```

## Non-Goals

- No palette definition.
- No token values.
- No contrast ratio specification.
- No CSS variables.
- No component styling.
- No theme implementation.

## Status

Implemented.
