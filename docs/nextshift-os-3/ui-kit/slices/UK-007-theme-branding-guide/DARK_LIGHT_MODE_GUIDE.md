# NextShift UI Kit v1.0

# UK-007 Dark Light Mode Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-007 Theme & Branding Guide  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-007 Planning, UK-006 Accessibility Guidelines, NextShift Design System v1.0  
**Outputs:** Light and dark mode usage guidance for Workspace-aware surfaces  
**Exit Criteria:** Mode guidance preserves meaning, accessibility, and Design System ownership

## Purpose

This document defines UI Kit guidance for applying light and dark mode expectations in NextShift product surfaces.

It does not define theme implementation, CSS, token values, color values, user preferences, persistence, or runtime switching behavior.

## Mode Authority

The Design System owns:

- Light and dark token values.
- Component rendering in each mode.
- Contrast implementation.
- Theme switching mechanics where applicable.

The UI Kit owns:

- Usage expectations.
- State preservation.
- Brand and Workspace identity guidance.
- Accessibility constraints.
- AI prompt constraints.

## Mode Principles

| Principle | Rule |
| --- | --- |
| Same meaning | Light and dark mode must communicate the same hierarchy, state, and action consequence. |
| Same components | Mode changes must not require alternate component families. |
| Same Workspace model | Workspace identity remains stable across modes. |
| Accessible contrast intent | Legibility and non-color state meaning are preserved. |
| No decorative inversion | Mode changes should not introduce visual effects that obscure work. |

## Light Mode Guidance

- Use default Design System mode behavior.
- Preserve neutral product surfaces for operational work.
- Brand accents should remain controlled.
- State tone should remain more important than decorative color.

## Dark Mode Guidance

- Preserve content hierarchy and reading order.
- Do not rely on glow, shadow, or saturation as the primary state cue.
- Ensure error, warning, success, selected, disabled, and loading states remain distinguishable by non-color cues.
- Workspace identity should remain visible without overpowering current task.

## Mode-Aware State Rules

- Loading state preserves context in both modes.
- Empty state remains legible and action-oriented.
- Error and warning states include text and recovery.
- Selected and focus states remain visible.
- AI confidence and uncertainty include text or structure, not color alone.

## Brand and Workspace Identity Across Modes

- Platform identity should remain consistent.
- Workspace markers should adapt through Design System theme behavior, not separate assets unless approved.
- Logo variants, if needed, are asset-governed and not defined by UI Kit.
- Workspace accent should not override semantic state tone in either mode.

## AI Design Prompt Template

```text
Theme mode:
Surface type:
Workspace identity:
State and tone requirements:
Brand accent usage:
Accessibility requirements:
Do not define token values, CSS, mode switching logic, or alternate component styling.
```

## Non-Goals

- No light or dark palette.
- No CSS or token values.
- No mode switcher implementation.
- No persistence logic.
- No asset export rules.
- No component rendering specification.

## Status

Implemented.
