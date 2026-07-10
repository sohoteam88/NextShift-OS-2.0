# NextShift UI Kit v1.0

# UK-006 Accessibility Anti-Patterns

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-006 Accessibility Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-006 Planning, UK-002 Anti-Patterns, UK-005 Interaction Anti-Patterns  
**Outputs:** Accessibility approaches to avoid in Workspace-aware surfaces  
**Exit Criteria:** Anti-patterns protect inclusion, trust, consistency, and Design System boundaries

## Purpose

This document identifies accessibility anti-patterns that should be avoided in NextShift Workspace interfaces.

## Color-Only Meaning

Anti-pattern:

- Communicating status, validation, priority, risk, AI confidence, or selection by color alone.

Preferred approach:

- Pair color with text, icon, shape, structure, or explicit state language.

## Icon-Only Critical Action

Anti-pattern:

- Using an icon-only control for a critical action without an accessible name expectation or visible context.

Preferred approach:

- Use clear text labels where possible and document accessible names for icon-only controls.

## Hover-Only Access

Anti-pattern:

- Revealing required controls, detail, or status only on hover.

Preferred approach:

- Provide keyboard, touch, and assistive technology paths through visible controls or accessible disclosure.

## Invisible or Illogical Focus

Anti-pattern:

- Focus is hidden, jumps unpredictably, or follows decorative order instead of task order.

Preferred approach:

- Preserve visible focus and align focus order with Workspace context, decision, action, and feedback.

## Keyboard Trap

Anti-pattern:

- Members enter a modal, menu, panel, flow, or disclosure and cannot leave by keyboard.

Preferred approach:

- Provide reachable close, cancel, back, or exit paths.

## Ambiguous Action Labels

Anti-pattern:

- Using labels such as `Submit`, `Continue`, `Manage`, or `OK` when the outcome is known.

Preferred approach:

- Use outcome-based labels such as `Create customer`, `Schedule follow-up`, or `Retry import`.

## Feedback Without Recovery

Anti-pattern:

- Error, blocked, or failed states explain the problem but provide no next action.

Preferred approach:

- Pair feedback with recovery, retry, correction, support, or setup guidance where available.

## Disabled Without Explanation

Anti-pattern:

- Disabling a primary action without explaining what is missing or invalid.

Preferred approach:

- Provide nearby validation, requirement, or blocked-state guidance.

## Responsive Accessibility Loss

Anti-pattern:

- Compact layouts hide labels, remove feedback, reorder task-critical content, or make navigation icon-only without accessible labeling.

Preferred approach:

- Preserve context, hierarchy, action access, labels, and state visibility across responsive reflow.

## AI Output Without Accessible Context

Anti-pattern:

- AI recommendations or summaries appear without reason, confidence, state, or available member action.

Preferred approach:

- Present recommendation, reason, confidence or uncertainty, accessible state, and accept/adjust/dismiss paths.

## Component Redesign Through Accessibility

Anti-pattern:

- Using accessibility documentation to redefine tokens, components, ARIA implementation, or runtime behavior.

Preferred approach:

- Document accessibility intent and usage; leave implementation to the released Design System and application layer.

## Workspace-Specific Accessibility Forks

Anti-pattern:

- Creating separate accessibility rules for Retail, Recruitment, Admin, or future Workspaces.

Preferred approach:

- Use shared accessibility expectations with Workspace-specific content and metadata.

## Review Questions

- Does the pattern rely on color, hover, motion, or visual position alone?
- Can keyboard users reach and complete the primary task?
- Can screen reader users understand context, state, and consequence?
- Does feedback include recovery?
- Are labels specific and outcome-based?
- Does responsive reflow preserve accessibility?
- Is implementation authority preserved?

## Status

Implemented.
