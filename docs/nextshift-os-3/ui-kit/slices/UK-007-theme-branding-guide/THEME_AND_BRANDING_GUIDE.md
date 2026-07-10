# NextShift UI Kit v1.0

# UK-007 Theme and Branding Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-007 Theme & Branding Guide  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-007 Planning, UK-007 Documentation Implementation Contract, STD-001 through STD-004, UK-001 through UK-006, NextShift Design System v1.0  
**Outputs:** Workspace-aware theme and branding guidance for NextShift product surfaces  
**Exit Criteria:** Theme and branding guidance is Workspace-aware, implementation-independent, and ready for Requirements Verification

## Purpose

This document defines the UI Kit guidance for applying NextShift theme and branding across Workspace-aware interfaces.

Theme and branding guidance describes how brand identity, visual tone, Workspace identity, color meaning, logo usage, and light/dark mode expectations should be applied consistently. It does not define design tokens, CSS, component implementation, runtime theme switching, asset generation, or brand governance outside the product interface.

## Scope

Included:

- Workspace-aware theme usage.
- Brand identity application.
- Logo and identity guidance.
- Color and tone usage at the UI Kit level.
- Light and dark mode guidance.
- Brand accessibility expectations.
- AI-assisted design prompt constraints.
- Brand and theme anti-patterns.

Excluded:

- Token values.
- Color palettes.
- CSS variables.
- Component styling implementation.
- Runtime theme persistence.
- Marketing site brand strategy.
- Business-specific campaign creative direction.

The released Design System, especially DS-001 Design Tokens and DS-008 Theme & Branding, remains the implementation authority.

## Theme Principles

| Principle | Rule |
| --- | --- |
| Brand supports work | Branding should clarify trust, context, and identity without overpowering operational tasks. |
| Workspace identity is contextual | Workspace branding identifies where the member is working; it must not create separate product systems. |
| Tokens are authoritative | UI Kit guidance never defines raw color, spacing, typography, or theme values. |
| State beats decoration | Color, logo, and tone cannot obscure state, feedback, hierarchy, or action consequence. |
| Accessibility is preserved | Theme choices must preserve UK-006 expectations for contrast intent, non-color meaning, and legibility. |
| AI generation is constrained | AI Design Agents may apply guidance but must not invent a new visual system. |

## Theme Application Model

Theme application should identify:

1. Product identity: NextShift as the platform.
2. Workspace identity: the active business operating context.
3. View purpose: dashboard, detail, form, module, flow, or settings view.
4. State and tone: neutral, info, success, warning, danger, selected, disabled, loading, error, or empty.
5. Brand element: logo, wordmark, icon, workspace label, color accent, illustration, or empty-state asset.
6. Constraint: Design System authority, accessibility expectation, and anti-patterns to avoid.

## Workspace Theme Rules

- Retail, Recruitment, Admin, and future Workspaces share the same theme system.
- Workspace-specific differences appear through metadata, labels, icons, approved imagery, and contextual accent usage.
- A Workspace theme must not fork the shell, component library, typography, spacing, or state language.
- Workspace identity should remain visible in the Workspace Header, switcher, and context region.
- Brand accents should support orientation, not replace navigation or state indicators.

## Brand Hierarchy

Use this hierarchy when applying branding:

1. NextShift platform identity.
2. Active Workspace identity.
3. Current view or module identity.
4. Entity or record identity.
5. Supporting brand detail.

Workspace or campaign visuals should not outrank the member's current task, state, or primary action.

## Relationship To Earlier UI Kit Slices

- UK-001 provides approved terminology and naming discipline.
- UK-002 provides clarity, consistency, accessibility, and trustworthy interaction principles.
- UK-003 provides component usage boundaries and state vocabulary.
- UK-004 provides layout hierarchy and responsive behavior.
- UK-005 provides interaction, feedback, and microinteraction expectations.
- UK-006 provides accessibility constraints for color, contrast intent, labels, and non-color state communication.

## AI Design Prompt Template

```text
Design authority: NextShift Design System v1.0
Language authority: NextShift UI Kit v1.0
Slice authority: UK-007 Theme & Branding Guide
Workspace context:
Surface type:
Brand identity to apply:
Theme mode:
State and tone requirements:
Accessibility constraints:
Do not define token values, CSS, component implementation, or a new visual system.
```

## Non-Goals

- No token definitions.
- No new brand palette.
- No CSS or implementation guidance.
- No component redesign.
- No runtime theme switching.
- No marketing brand strategy.

## Status

Implemented.
