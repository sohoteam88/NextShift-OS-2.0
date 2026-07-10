# NextShift UI Kit v1.0

# UK-007 Brand Usage Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-007 Theme & Branding Guide  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-007 Planning, UK-001 Terminology, UK-002 Design Principles, UK-006 Accessibility Guidelines  
**Outputs:** Brand usage guidance for NextShift product surfaces  
**Exit Criteria:** Brand usage guidance preserves platform consistency, Workspace identity, and Design System authority

## Purpose

This document defines how NextShift brand expression should be applied inside product interfaces.

Brand usage supports recognition, orientation, and trust. It does not define marketing copy, campaign creative, logo files, token values, or visual implementation.

## Brand Usage Principles

| Principle | Rule |
| --- | --- |
| Operational first | Brand expression must support member work before decoration. |
| Consistent identity | NextShift identity remains stable across Workspaces. |
| Contextual Workspace branding | Workspace identity clarifies context without replacing platform identity. |
| Controlled emphasis | Brand elements should not compete with primary actions or state feedback. |
| Accessible expression | Brand expression must preserve meaning without relying on color alone. |

## Product Brand Roles

| Brand Role | Purpose | Guidance |
| --- | --- | --- |
| Platform brand | Identifies the product as NextShift. | Stable across shells and global surfaces. |
| Workspace brand | Identifies the active Workspace. | Visible where actions are Workspace-scoped. |
| Module brand | Supports recognition of a bounded functional area. | Secondary to Workspace and current view. |
| State tone | Communicates status or feedback. | Uses Design System state language and components. |
| Supporting illustration or asset | Adds explanation in empty or onboarding states. | Must not obscure action or state. |

## Usage By Surface

### Workspace Shell

- Platform identity should remain stable.
- Workspace identity should be visible.
- Brand accents must not redefine navigation or focus behavior.
- Shell branding should not fork by Workspace type.

### Dashboard

- Branding should support context and scanning.
- Priority widgets and state feedback outrank decorative brand elements.
- Workspace-specific imagery should not replace metric meaning or AI reasoning.

### Detail View

- Entity identity, status, and primary action outrank brand decoration.
- Brand styling may support the view but should not obscure record-level state.

### Forms and Flows

- Brand expression should be restrained.
- Required fields, validation, confirmation, and recovery remain visually dominant.
- Onboarding imagery should support clarity, not add extra interpretation work.

### Empty and Loading States

- Brand assets may provide orientation or warmth.
- Empty states must still explain absence and provide next action where applicable.
- Loading states must preserve context and avoid decorative-only motion.

## Writing and Naming

- Use specific Workspace, module, and action names.
- Avoid generic brand phrases where operational language is clearer.
- Keep UI labels outcome-based.
- Do not introduce new terms that conflict with UK-001.

## AI Design Guidance

AI Design Agents should include:

```text
Brand role:
Workspace context:
Surface type:
Operational priority:
Allowed brand elements:
State and accessibility constraints:
Brand anti-patterns to avoid:
```

AI Design Agents must not invent brand systems, palettes, logos, token values, typography, or component styles.

## Non-Goals

- No marketing campaign guidance.
- No logo asset production.
- No brand voice guide outside product UI.
- No token or theme implementation.
- No component redesign.

## Status

Implemented.
